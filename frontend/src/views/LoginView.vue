<template>
  <div class="min-h-screen flex items-center justify-center px-6 bg-[radial-gradient(ellipse_at_50%_0%,_oklch(0.480_0.103_280/0.06)_0%,_transparent_60%)] bg-background">
    <Card class="w-full max-w-md animate-in slide-in-from-bottom-4 fade-in duration-500 shadow-xl">
      <CardHeader class="text-center">
        <div class="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-primary">
          <BookOpenText class="h-7 w-7" />
        </div>
        <CardTitle class="font-serif text-2xl tracking-wide text-primary">在线自习室</CardTitle>
        <CardDescription class="text-muted-foreground">和朋友们一起专注学习</CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs v-model="mode" class="w-full">
          <TabsList class="grid w-full grid-cols-2">
            <TabsTrigger value="login">登录</TabsTrigger>
            <TabsTrigger value="register">注册</TabsTrigger>
          </TabsList>

          <!-- 登录 -->
          <TabsContent value="login" class="pt-2">
            <form @submit.prevent="handleLogin" class="flex flex-col gap-4" autocomplete="off">
              <div class="flex flex-col gap-1.5">
                <Label for="login-email" class="flex items-center gap-1.5">
                  <Mail class="h-3.5 w-3.5 text-muted-foreground" />
                  邮箱
                </Label>
                <Input
                  id="login-email"
                  v-model="loginEmail"
                  type="email"
                  placeholder="请输入邮箱地址"
                  required
                />
              </div>
              <div class="flex flex-col gap-1.5">
                <Label for="login-password" class="flex items-center gap-1.5">
                  <Lock class="h-3.5 w-3.5 text-muted-foreground" />
                  密码
                </Label>
                <Input
                  id="login-password"
                  v-model="loginPassword"
                  type="password"
                  placeholder="请输入密码"
                  required
                />
              </div>
              <Button type="submit" :disabled="loading" class="mt-2">
                <Loader2 v-if="loading" class="h-4 w-4 animate-spin" />
                <span>{{ loading ? "登录中..." : "登录" }}</span>
              </Button>
            </form>
          </TabsContent>

          <!-- 注册 -->
          <TabsContent value="register" class="pt-2">
            <form @submit.prevent="handleRegister" class="flex flex-col gap-4" autocomplete="off">
              <div class="flex flex-col gap-1.5">
                <Label for="reg-nickname" class="flex items-center gap-1.5">
                  <User class="h-3.5 w-3.5 text-muted-foreground" />
                  昵称
                </Label>
                <Input
                  id="reg-nickname"
                  v-model="regNickname"
                  placeholder="给自己取个名字吧"
                  required
                />
              </div>
              <div class="flex flex-col gap-1.5">
                <Label for="reg-email" class="flex items-center gap-1.5">
                  <Mail class="h-3.5 w-3.5 text-muted-foreground" />
                  邮箱
                </Label>
                <Input
                  id="reg-email"
                  v-model="regEmail"
                  type="email"
                  placeholder="请输入邮箱地址"
                  required
                />
              </div>
              <div class="flex flex-col gap-1.5">
                <Label for="reg-password" class="flex items-center gap-1.5">
                  <Lock class="h-3.5 w-3.5 text-muted-foreground" />
                  密码
                </Label>
                <Input
                  id="reg-password"
                  v-model="regPassword"
                  type="password"
                  placeholder="6 位以上密码"
                  required
                  minlength="6"
                />
              </div>

              <Button type="submit" :disabled="loading" class="mt-2">
                <Loader2 v-if="loading" class="h-4 w-4 animate-spin" />
                <span>{{ loading ? "处理中..." : step === "verify" ? "重新发送验证码" : "注册" }}</span>
              </Button>

              <!-- 验证码区 -->
              <div
                v-if="step === 'verify'"
                class="flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-300"
              >
                <div class="flex items-center gap-3">
                  <Separator class="flex-1" />
                  <span class="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
                    <KeyRound class="h-3.5 w-3.5" />
                    输入邮箱验证码
                  </span>
                  <Separator class="flex-1" />
                </div>
                <div class="flex gap-2">
                  <Input
                    v-model="verifyCode"
                    placeholder="000000"
                    maxlength="6"
                    inputmode="numeric"
                    class="text-center font-mono text-xl tracking-[0.5em] font-semibold"
                    @input="onCodeInput"
                  />
                  <Button
                    type="button"
                    @click="handleVerify"
                    :disabled="verifyCode.length < 6 || loading"
                    class="whitespace-nowrap"
                  >
                    验证
                  </Button>
                </div>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { toast } from "@/components/ui/toaster";
import { BookOpenText, Mail, Lock, User, KeyRound, Loader2 } from "@lucide/vue";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import { api, setToken, setStoredUser } from "@/utils/api.js";

const router = useRouter();

const mode = ref("login");
const step = ref("register");
const loading = ref(false);

const loginEmail = ref("");
const loginPassword = ref("");

const regNickname = ref("");
const regEmail = ref("");
const regPassword = ref("");
const verifyCode = ref("");

function onCodeInput() {
  verifyCode.value = verifyCode.value.replace(/\D/g, "");
}

async function handleLogin() {
  loading.value = true;
  try {
    const data = await api("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: loginEmail.value, password: loginPassword.value }),
    });
    onAuthSuccess(data);
  } catch (e) {
    toast.error(e.data?.detail || e.message || "登录失败");
  } finally {
    loading.value = false;
  }
}

async function handleRegister() {
  loading.value = true;
  try {
    await api("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email: regEmail.value,
        password: regPassword.value,
        nickname: regNickname.value,
      }),
    });
    toast.success("验证码已发送到邮箱，请查收");
    step.value = "verify";
  } catch (e) {
    toast.error(e.data?.detail || e.message || "注册失败");
  } finally {
    loading.value = false;
  }
}

async function handleVerify() {
  loading.value = true;
  try {
    const data = await api("/auth/verify", {
      method: "POST",
      body: JSON.stringify({ email: regEmail.value, code: verifyCode.value }),
    });
    toast.success("验证成功，欢迎加入！");
    onAuthSuccess(data);
  } catch (e) {
    toast.error(e.data?.detail || e.message || "验证码错误");
  } finally {
    loading.value = false;
  }
}

function onAuthSuccess(data) {
  setToken(data.access_token);
  setStoredUser({ id: data.user_id, email: data.email, nickname: data.nickname });
  router.push("/lobby");
}
</script>
