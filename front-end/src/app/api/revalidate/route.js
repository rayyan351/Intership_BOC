// front-end/src/app/api/revalidate/route.js
import { NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';

export async function POST(request) {
  try {
    const { path, tag, secret } = await request.json();

    // Verify a shared secret to prevent unauthorized cache purging. No fallback:
    // an unset secret must reject every request, not accept a public default.
    const revalidateSecret = process.env.REVALIDATION_SECRET;
    if (!revalidateSecret || secret !== revalidateSecret) {
      return NextResponse.json({ message: 'Invalid revalidation token' }, { status: 401 });
    }

    if (tag) {
      revalidateTag(tag);
    }

    if (path) {
      revalidatePath(path, 'layout');
    } else {
      revalidatePath('/', 'layout');
    }

    return NextResponse.json({ revalidated: true, now: Date.now() });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}