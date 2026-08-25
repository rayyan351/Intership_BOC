// src/app/api/safepay/callback/route.js
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const tracker = formData.get('tracker') || formData.get('beacon') || '';
    const reference = formData.get('reference') || '';
    const sig = formData.get('sig') || '';

    // Safepay posts form data — forward these params via standard GET to checkout page
    const origin = request.nextUrl.origin;
    const redirectUrl = new URL('/checkout', origin);
    
    if (tracker) redirectUrl.searchParams.set('beacon', tracker);
    if (reference) redirectUrl.searchParams.set('reference', reference);
    if (sig) redirectUrl.searchParams.set('sig', sig);

    return NextResponse.redirect(redirectUrl.toString(), 303);
  } catch (error) {
    console.error('Safepay Callback Error:', error);
    return NextResponse.redirect(new URL('/checkout?error=payment_failed', request.nextUrl.origin), 303);
  }
}

export async function GET(request) {
  return NextResponse.redirect(new URL('/checkout', request.nextUrl.origin));
}