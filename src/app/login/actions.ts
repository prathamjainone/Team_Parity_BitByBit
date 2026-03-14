'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const credentials = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { data: authData, error } = await supabase.auth.signInWithPassword(credentials)

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`)
  }

  // After login, fetch role from public users table
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', authData.user!.id)
    .single()
  
  revalidatePath('/', 'layout')
  
  if (profile?.role === 'employer') {
    redirect('/dashboard/employer')
  } else {
    redirect('/dashboard/freelancer')
  }
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    name: formData.get('name') as string,
    role: (formData.get('role') as string).toLowerCase(), // DB expects lowercase
  }

  const { data: authData, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        name: data.name,
        role: data.role, // lowercase stored in metadata too
      }
    }
  })

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`)
  }

  if (authData.user) {
     const { error: dbError } = await supabase.from('users').upsert({
       id: authData.user.id,
       email: data.email,
       name: data.name,
       role: data.role,
       wallet_balance: data.role === 'employer' ? 10000 : 0,
       pfi_score: 750,
     }, { onConflict: 'id' })

     if (dbError) {
       console.error("Error creating public user profile:", dbError)
       redirect(`/login?error=${encodeURIComponent('Profile creation failed: ' + dbError.message)}`)
     }
  }

  revalidatePath('/', 'layout')
  
  if (data.role === 'employer') {
    redirect('/dashboard/employer')
  } else {
    redirect('/dashboard/freelancer')
  }
}

export async function signout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}
