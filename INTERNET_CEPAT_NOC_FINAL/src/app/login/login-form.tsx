"use client"

import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { useRouter } from "next/navigation"
import { createAuthClient } from "better-auth/react"
import { z } from "zod"

const authClient = createAuthClient()
const schema = z.object({ email: z.string().email("Email tidak valid"), password: z.string().min(6, "Password minimal 6 karakter") })

export function LoginForm() {
  const router = useRouter()
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function submit(formData: FormData) {
    const parsed = schema.safeParse(Object.fromEntries(formData))
    if (!parsed.success) { setError(parsed.error.issues[0].message); return }
    setLoading(true)
    const { error } = await authClient.signIn.email(parsed.data)
    if (error) { setError("Email atau password salah"); setLoading(false); return }
    router.push("/dashboard")
    router.refresh()
  }

  return <form className="stack" action={submit}>
    <label className="field">Email<input className="input" name="email" type="email" autoComplete="email" required /></label>
    <label className="field">Password<span style={{ position: "relative", display: "block" }}><input className="input" style={{ width: "100%", paddingRight: 42 }} name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required /><button type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", border: 0, background: "transparent", color: "var(--muted)", padding: 4, display: "grid", placeItems: "center" }}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></span></label>
    {error && <div className="error">{error}</div>}
    <button className="btn btn-primary" disabled={loading}>{loading ? "Memproses..." : "Masuk"}</button>
  </form>
}
