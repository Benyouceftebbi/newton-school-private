"use client"
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from 'react';
import { signIn } from "@/lib/auth";
import { useRouter } from "@/navigation";
import { authenticationschema } from "@/validators/authentication"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

function SignIn() {
  const router = useRouter();
  const form = useForm<z.infer<typeof authenticationschema>>({
    resolver: zodResolver(authenticationschema)
  })


  const handleSignIn = async (data:z.infer<typeof authenticationschema>) => {
    try {
      await signIn(data.email, data.password, true);
      //if role parente
      //if parent parendachos
      router.push('/dashboard');
    } catch (error) {
      window.alert('Wrong password or email');
    }
  };

  return (
    <div className="w-full lg:grid lg:grid-cols-2  min-h-screen">
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[350px] gap-6">
          <div className="grid gap-2 text-center">
            <h1 className="text-3xl font-bold">Login</h1>
            <p className="text-balance text-muted-foreground">
              Enter your email below to login to your account
            </p>
          </div>
          <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSignIn)} >
          <div className="grid gap-4">
            <div className="grid gap-2">
            <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="email" {...field} />
              </FormControl>
          
              <FormMessage />
            </FormItem>
          )}
        />
            </div>
            <div className="grid gap-2">
     
              <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
                       <div className="flex items-center">
              <FormLabel>Password</FormLabel>
              
              <Link
                  href="/forgot-password"
                  className="ml-auto inline-block text-sm underline"
                >
                  Forgot your password?
                </Link>
              </div>
              <FormControl>
                <Input placeholder="password" {...field} type="password"/>
              </FormControl>
          
              <FormMessage />
            </FormItem>
          )}
        />
          
            
            
            </div>
            <Button type="submit" className="w-full">
              Login
            </Button>
            <Button variant="outline" className="w-full">
              Login with Google
            </Button>
          </div>
          </form>
          </Form>
          <div className="mt-4 text-center text-sm">
            Don&apos;t have an account?{" "}
            <Link href="#" className="underline">
              Sign up
            </Link>
          </div>
        </div>
      </div>
      <div className="hidden bg-muted lg:block">
        <Image
          src="/placeholder.svg"
          alt="Image"
          width="1920"
          height="1080"
          className="h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </div>
  );
}

export default SignIn;
