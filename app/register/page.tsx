"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@clerk/nextjs"
import { useSignUp } from "@clerk/nextjs/legacy"
import { isClerkAPIResponseError } from "@clerk/nextjs/errors"
import { syncBackendUserProfile } from "@/lib/api/user-sync"
import { Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

export default function RegisterPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [address, setAddress] = useState("")
  const [phone, setPhone] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const { isLoaded: signUpLoaded, signUp, setActive } = useSignUp()
  const { isLoaded: authLoaded, isSignedIn, getToken } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    if (authLoaded && isSignedIn) {
      router.replace("/")
    }
  }, [authLoaded, isSignedIn, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!signUpLoaded) return

    setIsSubmitting(true)

    if (password !== confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "Password and confirm password should match.",
        variant: "destructive",
      })
      setIsSubmitting(false)
      return
    }

    const [firstName, ...rest] = name.trim().split(" ")
    const lastName = rest.join(" ").trim() || undefined

    try {
      const signUpAttempt = await signUp.create({
        emailAddress: email,
        password,
        firstName,
        lastName,
      })

      if (signUpAttempt.status === "complete") {
        await setActive({ session: signUpAttempt.createdSessionId })
        const token = await getToken()

        if (!token) {
          throw new Error("Unable to establish authenticated session")
        }

        await syncBackendUserProfile(token, {
          name,
          email,
          address,
          phone,
        })

        toast({
          title: "Registration successful",
          description: "Your account has been created.",
        })
        router.push("/")
      } else {
        toast({
          title: "Verification required",
          description: "Complete your pending sign-up step in Clerk.",
          variant: "destructive",
        })
      }
    } catch (error) {
      const description = isClerkAPIResponseError(error)
        ? error.errors?.[0]?.longMessage || error.errors?.[0]?.message || "Please check your information and try again."
        : error instanceof Error
          ? error.message
          : "Please check your information and try again."

      toast({
        title: "Registration failed",
        description,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoogleSignUp = async () => {
    if (!signUpLoaded) return

    try {
      setIsGoogleLoading(true)
      await signUp.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/",
      })
    } catch (error) {
      const description = isClerkAPIResponseError(error)
        ? error.errors?.[0]?.longMessage || error.errors?.[0]?.message || "Google sign-up failed. Please try again."
        : error instanceof Error
          ? error.message
          : "Google sign-up failed. Please try again."

      toast({
        title: "Google sign-up failed",
        description,
        variant: "destructive",
      })
      setIsGoogleLoading(false)
    }
  }

  if (!authLoaded || !signUpLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl">Create an Account</CardTitle>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/20 p-4">
      <Card className="w-full max-w-md border-border/70 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Create an Account</CardTitle>
          <CardDescription>Enter your details to register for a new account</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGoogleSignUp}
              disabled={isGoogleLoading || isSubmitting}
            >
              <svg viewBox="0 0 24 24" className="mr-2 h-4 w-4" aria-hidden="true">
                <path
                  fill="#EA4335"
                  d="M12 10.2v3.9h5.5c-.2 1.2-1.4 3.6-5.5 3.6-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 2.9 14.7 2 12 2 6.5 2 2 6.5 2 12s4.5 10 10 10c5.8 0 9.6-4.1 9.6-9.9 0-.7-.1-1.2-.2-1.9H12z"
                />
              </svg>
              {isGoogleLoading ? "Redirecting to Google..." : "Sign up with Google"}
            </Button>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
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
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isSubmitting || isGoogleLoading}>
              {isSubmitting ? "Creating account..." : "Register"}
            </Button>
            <p className="text-sm text-center">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:underline">
                Login
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
