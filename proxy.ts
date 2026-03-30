import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// 定义需要保护的路由：这里把 52 周面板的路径保护起来
const isProtectedRoute = createRouteMatcher(['/virtue_tracker(.*)'])

export default clerkMiddleware(async (auth, req) => {
  // 如果用户访问的是被保护的路由，并且未登录，则强制跳转到登录/注册弹窗
  if (isProtectedRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}