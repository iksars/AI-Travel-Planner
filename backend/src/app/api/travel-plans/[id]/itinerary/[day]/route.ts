import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(req: NextRequest, { params }) {
  const { id, day } = params
  const body = await req.json()
  // body: { activities, accommodation, transportation, restaurants, notes, date }

  let itinerary = await prisma.itinerary.findFirst({
    where: { travelPlanId: id, day: Number(day) }
  })

  if (itinerary) {
    itinerary = await prisma.itinerary.update({
      where: { id: itinerary.id },
      data: {
        activities: JSON.stringify(body.activities),
        accommodation: JSON.stringify(body.accommodation),
        transportation: body.transportation,
        restaurants: JSON.stringify(body.restaurants),
        notes: body.notes,
        date: body.date,
      },
    })
  } else {
    itinerary = await prisma.itinerary.create({
      data: {
        travelPlanId: id,
        day: Number(day),
        activities: JSON.stringify(body.activities),
        accommodation: JSON.stringify(body.accommodation),
        transportation: body.transportation,
        restaurants: JSON.stringify(body.restaurants),
        notes: body.notes,
        date: body.date,
      },
    })
  }
  return NextResponse.json({ success: true, itinerary })
}
