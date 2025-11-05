// pages/api/ai/speech-to-text.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import axios from 'axios';
import { extractTravelPlanFromTextWithRaw } from '@/lib/ai';
import { applyCors } from '@/lib/cors';

// 延长 Vercel 函数的最大执行时间至 300 秒
export const maxDuration = 300;

// 禁用 Next.js 的内置 bodyParser，以便我们可以将请求作为流处理
export const config = {
  api: {
    bodyParser: false,
  },
};

const XF_APPID = process.env.XF_APPID;
const XF_API_SECRET = process.env.XF_API_SECRET; // 使用 APISecret
const XF_APIKEY = process.env.XF_APIKEY; // 保留用于兼容旧签名或特定场景

const BASE_URL = 'https://raasr.xfyun.cn/v2/api'; // 更新为 V2 API

// --- 辅助函数 ---

/**
 * 生成讯飞 API (V2) 所需的签名
 * @param appid - 应用ID
 * @param secret - API Secret
 */
const getSignaV2 = (appid: string, secret: string): { ts: string; signa: string } => {
  const ts = Math.floor(Date.now() / 1000).toString();
  const base = appid + ts;
  const hash = crypto.createHash('md5').update(base).digest('hex');
  const signa = crypto.createHmac('sha1', secret).update(hash).digest('base64');
  return { ts, signa };
};

/**
 * 从请求中读取完整的音频数据并返回一个 Buffer
 */
const getAudioBuffer = (req: NextApiRequest): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', (err) => reject(new Error(`Failed to read audio stream: ${err.message}`)));
  });
};

/**
 * 轮询获取转写结果 (V2)
 * @param orderId - 订单ID
 */
const pollForResultV2 = (orderId: string): Promise<string> => {
  const maxAttempts = 100; // 最多轮询100次 (约5分钟)
  const interval = 3000; // 每3秒轮询一次
  let attempts = 0;

  return new Promise((resolve, reject) => {
    const intervalId = setInterval(async () => {
      if (attempts++ > maxAttempts) {
        clearInterval(intervalId);
        reject(new Error('Transcription polling timed out.'));
        return;
      }

      try {
        const { ts, signa } = getSignaV2(XF_APPID!, XF_API_SECRET!);
        const params = new URLSearchParams({
          appId: XF_APPID!,
          signa,
          ts,
          orderId: orderId,
          resultType: 'transfer',
        });

        const res = await axios.get(`${BASE_URL}/getResult?${params.toString()}`, { timeout: 60000 });
        const data = res.data;

        if (data.code !== '000000') {
          // 26605: 任务正在处理中，是正常轮询状态，不应视为错误
          if (data.code === '26605') {
            console.log(`Polling for order ${orderId}: In progress...`);
            return;
          }
          clearInterval(intervalId);
          reject(new Error(`Failed to get result: ${data.descInfo} (code: ${data.code})`));
          return;
        }

        const orderInfo = data.content?.orderInfo;
        if (orderInfo && orderInfo.status === 4) { // 状态 4 表示已完成
          clearInterval(intervalId);
          const orderResult = JSON.parse(data.content.orderResult);
          let fullText = '';
          orderResult.lattice.forEach((item: any) => {
            const json_1best = JSON.parse(item.json_1best);
            json_1best.st.rt.forEach((rt: any) => {
              rt.ws.forEach((ws: any) => {
                ws.cw.forEach((cw: any) => {
                  fullText += cw.w;
                });
              });
            });
          });
          resolve(fullText);
        } else if (orderInfo && orderInfo.status === -1) { // 状态 -1 表示失败
          clearInterval(intervalId);
          const failType = orderInfo.failType;
          reject(new Error(`Transcription task failed on the server. Fail type: ${failType}`));
        }
        // 其他状态码 (如 0, 3) 表示仍在处理中，继续轮询
      } catch (error: any) {
        clearInterval(intervalId);
        reject(new Error(`Error during polling: ${error.message}`));
      }
    }, interval);
  });
};


// --- API 路由处理器 ---

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 应用 CORS 中间件
  if (applyCors(req, res)) {
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!XF_APPID || !XF_API_SECRET) {
    console.error('Xunfei API credentials not configured (APPID or API_SECRET missing)');
    return res.status(500).json({ error: 'Audio service not configured' });
  }

  try {
    // 1. 完整接收音频数据
    const audioBuffer = await getAudioBuffer(req);
    if (audioBuffer.length === 0) {
      return res.status(400).json({ error: 'No audio data received' });
    }
    const fileSize = audioBuffer.length;

    // 2. 上传文件 (Upload - V2)
    const { ts, signa } = getSignaV2(XF_APPID, XF_API_SECRET);
    const fileName = `audio-${Date.now()}.wav`;
    const uploadParams = new URLSearchParams({
      appId: XF_APPID,
      signa,
      ts,
      fileSize: fileSize.toString(),
      fileName,
      duration: '300', // V2文档中此参数为必填但未校验，可随意填写
    });

    const uploadRes = await axios.post(`${BASE_URL}/upload?${uploadParams.toString()}`, audioBuffer, {
      headers: { 'Content-Type': 'application/octet-stream' },
      timeout: 60000,
    });

    if (uploadRes.data.code !== '000000') {
      throw new Error(`Upload failed: ${uploadRes.data.descInfo} (code: ${uploadRes.data.code})`);
    }
    const orderId = uploadRes.data.content.orderId;

    // 3. 轮询获取结果 (Get Result - V2)
    const fullText = await pollForResultV2(orderId);

    // 4. 使用AI提取旅行计划
    const extractedPlan = await extractTravelPlanFromTextWithRaw(fullText);

    // 5. 返回成功响应
    res.status(200).json(extractedPlan);

  } catch (error: any) {
    console.error('Speech-to-text process failed:', error.message);
    res.status(500).json({ error: error.message || 'An unknown error occurred' });
  }
}
