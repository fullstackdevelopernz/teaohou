import { NextResponse } from 'next/server';
export function GET(){return NextResponse.json({service:'teaohou',status:'ok',release:'public-preview',privateIntake:false},{headers:{'Cache-Control':'no-store'}})}
