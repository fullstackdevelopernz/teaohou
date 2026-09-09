import { NextResponse } from 'next/server';
export async function GET(){return NextResponse.json({error:'Private case access is not configured.'},{status:503,headers:{'Cache-Control':'no-store'}})}
export async function POST(){return NextResponse.json({error:'Private intake is not enabled. Do not submit personal information.'},{status:503,headers:{'Cache-Control':'no-store'}})}
