import { NextRequest, NextResponse } from 'next/server';

export function middleware(request:NextRequest){
  if(request.method==='GET' && request.nextUrl.pathname==='/workspace/housing' && !request.nextUrl.searchParams.has('_build')){
    const url=request.nextUrl.clone();
    url.searchParams.set('_build','20260916a');
    return NextResponse.redirect(url,307);
  }
  return NextResponse.next();
}

export const config={matcher:['/workspace/housing']};
