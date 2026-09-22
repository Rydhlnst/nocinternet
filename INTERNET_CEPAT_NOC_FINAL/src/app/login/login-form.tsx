"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createAuthClient } from "better-auth/react"
import { z } from "zod"
const authClient = createAuthClient()
const schema = z.object({ email: z.string().email("Email tidak valid"), password: z.string().min(6, "Password minimal 6 karakter") })
export function LoginForm() { const router = useRouter(); const [error, setError] = useState(""); const [loading, setLoading] = useState(false); async function submit(formData: FormData) { const parsed = schema.safeParse(Object.fromEntries(formData)); if (!parsed.success) { setError(parsed.error.issues[0].message); return }; setLoading(true); const { error } = await authClient.signIn.email(parsed.data); if (error) { setError("Email atau password salah"); setLoading(false); return }; router.push("/dashboard"); router.refresh() }; return <form className="stack" action={submit}><label className="field">Email<input className="input" name="email" type="email" autoComplete="email" required /></label><label className="field">Password<input className="input" name="password" type="password" autoComplete="current-password" required /></label>{error && <div className="error">{error}</div>}<button className="btn btn-primary" disabled={loading}>{loading ? "Memproses..." : "Masuk"}</button></form> }
