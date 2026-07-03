import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { BookOpenText, Loader2, Lock, Mail, User, KeyRound } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { authApi } from "@/api/auth";
import { useAuthStore } from "@/stores/authStore";
import { ApiError } from "@/lib/api";

const loginSchema = z.object({
  email: z.string().email("邮箱格式不正确"),
  password: z.string().min(1, "请输入密码"),
});

const registerSchema = z.object({
  nickname: z.string().min(1, "请输入昵称"),
  email: z.string().email("邮箱格式不正确"),
  password: z.string().min(6, "密码至少 6 位"),
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [step, setStep] = useState<"register" | "verify">("register");
  const [loading, setLoading] = useState(false);
  const [verifyCode, setVerifyCode] = useState("");
  const [regEmail, setRegEmail] = useState("");

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { nickname: "", email: "", password: "" },
  });

  async function onLogin(data: LoginForm) {
    setLoading(true);
    try {
      const resp = await authApi.login({
        email: data.email,
        password: data.password,
      });
      setAuth(resp.access_token, {
        id: resp.user_id,
        email: resp.email,
        nickname: resp.nickname,
      });
      toast.success("登录成功");
      navigate("/lobby");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "登录失败");
    } finally {
      setLoading(false);
    }
  }

  async function onRegister(data: RegisterForm) {
    setLoading(true);
    try {
      await authApi.register({
        email: data.email,
        password: data.password,
        nickname: data.nickname,
      });
      setRegEmail(data.email);
      setStep("verify");
      toast.success("验证码已发送到邮箱，请查收");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "注册失败");
    } finally {
      setLoading(false);
    }
  }

  async function onVerify() {
    if (verifyCode.length < 6) return;
    setLoading(true);
    try {
      const resp = await authApi.verify({ email: regEmail, code: verifyCode });
      setAuth(resp.access_token, {
        id: resp.user_id,
        email: resp.email,
        nickname: resp.nickname,
      });
      toast.success("验证成功，欢迎加入！");
      navigate("/lobby");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "验证码错误");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-[radial-gradient(ellipse_at_50%_0%,_oklch(0.475_0.095_55/0.08)_0%,_transparent_60%)] bg-background">
      <Card className="w-full max-w-md shadow-xl animate-slide-up">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-primary">
            <BookOpenText className="h-7 w-7" />
          </div>
          <CardTitle className="font-serif text-2xl tracking-wide text-primary">
            在线自习室
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            和朋友们一起专注学习
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs
            value={mode}
            onValueChange={(v) => {
              setMode(v as "login" | "register");
              setStep("register");
            }}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 relative">
              <div
                className="absolute inset-y-0 left-0 bg-background shadow-sm rounded-md transition-[transform] duration-300 ease-in-out pointer-events-none"
                style={{
                  width: "50%",
                  transform:
                    mode === "login"
                      ? "translateX(0%)"
                      : "translateX(100%)",
                }}
              />
              <TabsTrigger
                value="login"
                className="relative z-10 data-[state=active]:text-foreground"
              >
                登录
              </TabsTrigger>
              <TabsTrigger
                value="register"
                className="relative z-10 data-[state=active]:text-foreground"
              >
                注册
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="pt-2">
              <form
                onSubmit={loginForm.handleSubmit(onLogin)}
                className="flex flex-col gap-4"
                autoComplete="off"
              >
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="login-email" className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    邮箱
                  </Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="请输入邮箱地址"
                    {...loginForm.register("email")}
                  />
                  {loginForm.formState.errors.email && (
                    <p className="text-xs text-destructive">
                      {loginForm.formState.errors.email.message}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label
                    htmlFor="login-password"
                    className="flex items-center gap-1.5"
                  >
                    <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                    密码
                  </Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="请输入密码"
                    {...loginForm.register("password")}
                  />
                  {loginForm.formState.errors.password && (
                    <p className="text-xs text-destructive">
                      {loginForm.formState.errors.password.message}
                    </p>
                  )}
                </div>
                <Button type="submit" disabled={loading} className="mt-2">
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>{loading ? "登录中..." : "登录"}</span>
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register" className="pt-2">
              <form
                onSubmit={registerForm.handleSubmit(onRegister)}
                className="flex flex-col gap-4"
                autoComplete="off"
              >
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="reg-nickname" className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                    昵称
                  </Label>
                  <Input
                    id="reg-nickname"
                    placeholder="给自己取个名字吧"
                    {...registerForm.register("nickname")}
                  />
                  {registerForm.formState.errors.nickname && (
                    <p className="text-xs text-destructive">
                      {registerForm.formState.errors.nickname.message}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="reg-email" className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    邮箱
                  </Label>
                  <Input
                    id="reg-email"
                    type="email"
                    placeholder="请输入邮箱地址"
                    {...registerForm.register("email")}
                  />
                  {registerForm.formState.errors.email && (
                    <p className="text-xs text-destructive">
                      {registerForm.formState.errors.email.message}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="reg-password" className="flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                    密码
                  </Label>
                  <Input
                    id="reg-password"
                    type="password"
                    placeholder="6 位以上密码"
                    {...registerForm.register("password")}
                  />
                  {registerForm.formState.errors.password && (
                    <p className="text-xs text-destructive">
                      {registerForm.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <Button type="submit" disabled={loading} className="mt-2">
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>
                    {loading
                      ? "处理中..."
                      : step === "verify"
                        ? "重新发送验证码"
                        : "注册"}
                  </span>
                </Button>

                {step === "verify" && (
                  <div className="flex flex-col gap-3 animate-fade-in">
                    <div className="flex items-center gap-3">
                      <Separator className="flex-1" />
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
                        <KeyRound className="h-3.5 w-3.5" />
                        输入邮箱验证码
                      </span>
                      <Separator className="flex-1" />
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={verifyCode}
                        onChange={(e) =>
                          setVerifyCode(e.target.value.replace(/\D/g, ""))
                        }
                        placeholder="000000"
                        maxLength={6}
                        inputMode="numeric"
                        className="text-center font-mono text-xl tracking-[0.5em] font-semibold"
                      />
                      <Button
                        type="button"
                        onClick={onVerify}
                        disabled={verifyCode.length < 6 || loading}
                        className="whitespace-nowrap"
                      >
                        验证
                      </Button>
                    </div>
                  </div>
                )}
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
