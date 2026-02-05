import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// 公開ルートの定義（認証不要でアクセス可能）
const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)', 
  '/sign-up(.*)',
  '/api/webhooks(.*)',
  '/access-denied' // アクセス拒否ページも公開
])

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    // 未認証の場合はサインインページへリダイレクト
    await auth.protect()
  }
})

export const config = {
  matcher: [
    // Next.jsの内部ファイルや静的ファイルを除外
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // APIルートとtrpcを含める
    '/(api|trpc)(.*)',
  ],
}
