"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@clerk/nextjs"
import { useSignIn } from "@clerk/nextjs/legacy"
import { isClerkAPIResponseError } from "@clerk/nextjs/errors"
import { syncBackendUserProfile } from "@/lib/api/user-sync"
import { Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

function getServerErrorMessage(error: unknown, fallback: string) {
  if (isClerkAPIResponseError(error)) {
    const clerkMessages = (error.errors || [])
      .map((entry) => entry.longMessage || entry.message)
      .filter((message): message is string => Boolean(message))

    if (clerkMessages.length > 0) {
      return clerkMessages.join(" ")
    }

    return fallback
  }

  if (typeof error === "object" && error !== null) {
    const candidate = error as {
      response?: { data?: any }
      message?: string
    }

    const responseData = candidate.response?.data

    if (typeof responseData?.message === "string" && responseData.message.trim()) {
      return responseData.message
    }

    if (Array.isArray(responseData?.errors)) {
      const messages = responseData.errors
        .map((entry: any) => {
          if (typeof entry === "string") return entry
          if (typeof entry?.message === "string") return entry.message
          return ""
        })
        .filter((message: string) => Boolean(message))

      if (messages.length > 0) {
        return messages.join(" ")
      }
    }

    if (responseData?.errors && typeof responseData.errors === "object") {
      const messages = Object.values(responseData.errors)
        .flatMap((entry: any) => (Array.isArray(entry) ? entry : [entry]))
        .map((entry: any) => {
          if (typeof entry === "string") return entry
          if (typeof entry?.message === "string") return entry.message
          return ""
        })
        .filter((message: string) => Boolean(message))

      if (messages.length > 0) {
        return messages.join(" ")
      }
    }

    if (typeof candidate.message === "string" && candidate.message.trim()) {
      return candidate.message
    }
  }

  return fallback
}

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [verificationCode, setVerificationCode] = useState("")
  const [isSecondFactorStep, setIsSecondFactorStep] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const { isLoaded: signInLoaded, signIn, setActive } = useSignIn()
  const { isLoaded: authLoaded, isSignedIn, getToken } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const redirectPath = "/"

  useEffect(() => {
    if (authLoaded && isSignedIn) {
      router.replace(redirectPath)
    }
  }, [authLoaded, isSignedIn, redirectPath, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!signInLoaded) return

    setIsSubmitting(true)

    try {
      if (isSecondFactorStep) {
        const secondFactorAttempt = await signIn.attemptSecondFactor({
          strategy: "email_code",
          code: verificationCode,
        })

        if (secondFactorAttempt.status === "complete") {
          await setActive({ session: secondFactorAttempt.createdSessionId })
          const token = await getToken()

          if (!token) {
            throw new Error("Unable to establish authenticated session")
          }

          await syncBackendUserProfile(token, { email })

          toast({
            title: "Login successful",
            description: "Welcome back to Try-On Store!",
          })
          router.push("/")
        } else {
          toast({
            title: "Verification not complete",
            description: `Current sign-in status: ${secondFactorAttempt.status}`,
            variant: "destructive",
          })
        }
        return
      }

      const signInAttempt = await signIn.create({
        identifier: email,
        password,
      })

      if (signInAttempt.status === "complete") {
        await setActive({ session: signInAttempt.createdSessionId })
        const token = await getToken()

        if (!token) {
          throw new Error("Unable to establish authenticated session")
        }

        await syncBackendUserProfile(token, { email })

        toast({
          title: "Login successful",
          description: "Welcome back to Try-On Store!",
        })
        router.push("/")
      } else if (signInAttempt.status === "needs_second_factor") {
        await signInAttempt.prepareSecondFactor({ strategy: "email_code" })
        setIsSecondFactorStep(true)
        toast({
          title: "Verification code sent",
          description: "Enter the email verification code to finish signing in.",
        })
      } else {
        const firstFactors =
          signInAttempt.supportedFirstFactors?.map((f: any) => f.strategy).join(", ") || "none"
        const secondFactors =
          signInAttempt.supportedSecondFactors?.map((f: any) => f.strategy).join(", ") || "none"

        console.error("Clerk sign-in not complete", {
          status: signInAttempt.status,
          firstFactors,
          secondFactors,
        })

        toast({
          title: "Additional verification required",
          description:
            "Sign-in status: " +
            signInAttempt.status +
            ". First factors: " +
            firstFactors +
            ". Second factors: " +
            secondFactors,
          variant: "destructive",
        })
      }
    } catch (error) {
      const description = getServerErrorMessage(error, "Please check your credentials and try again.")

      toast({
        title: "Login failed",
        description,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoogleSignIn = async () => {
    if (!signInLoaded) return

    try {
      setIsGoogleLoading(true)
      await signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/",
      })
    } catch (error) {
      const description = getServerErrorMessage(error, "Google sign-in failed. Please try again.")

      toast({
        title: "Google sign-in failed",
        description,
        variant: "destructive",
      })
      setIsGoogleLoading(false)
    }
  }

  if (!authLoaded || !signInLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl">Login</CardTitle>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/20 p-4">
      <Card className="w-full max-w-md border-border/70 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>
            {isSecondFactorStep
              ? "Enter the verification code sent to your email"
              : "Enter your credentials to access your account"}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {!isSecondFactorStep && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleGoogleSignIn}
                  disabled={isGoogleLoading || isSubmitting}
                >
                  <svg viewBox="0 0 24 24" className="mr-2 h-4 w-4" aria-hidden="true">
                    <path
                      fill="#EA4335"
                      d="M12 10.2v3.9h5.5c-.2 1.2-1.4 3.6-5.5 3.6-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 2.9 14.7 2 12 2 6.5 2 2 6.5 2 12s4.5 10 10 10c5.8 0 9.6-4.1 9.6-9.9 0-.7-.1-1.2-.2-1.9H12z"
                    />
                  </svg>
                  {isGoogleLoading ? "Redirecting to Google..." : "Continue with Google"}
                </Button>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
                  </div>
                </div>
              </>
            )}
            {isSecondFactorStep ? (
              <div className="space-y-2">
                <Label htmlFor="verification-code">Verification Code</Label>
                <Input
                  id="verification-code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="Enter email code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  required
                />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="pr-10"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isSubmitting || isGoogleLoading}>
              {isSubmitting ? "Processing..." : isSecondFactorStep ? "Verify Code" : "Login"}
            </Button>
            {!isSecondFactorStep && (
              <p className="text-sm text-center">
                Don&apos;t have an account?{" "}
                <Link href="/register" className="text-primary hover:underline">
                  Register
                </Link>
              </p>
            )}
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
