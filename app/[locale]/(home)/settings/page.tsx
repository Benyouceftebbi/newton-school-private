"use client"
import { Separator } from "@/components/ui/separator"
import { ProfileForm } from "./level/components/profile-form"
import { useTranslations } from "next-intl"
import {Component} from './components/qr'
import { httpsCallable } from "firebase/functions"
import { functions } from "@/firebase/firebase-config"

const SettingsProfilePage = () => {
  const t=useTranslations()
  const callCreateUserAndAssignRole = async (userData) => {
    try {
      const createUserAndAssignRole = httpsCallable(functions, 'createUserAndAssignRole');
      const response = await createUserAndAssignRole(userData);
      console.log('User created:', response.data);
    } catch (error) {
      console.error('Error creating user:', error);
    }
  };
  
  // Example usage in a button click handler
  const handleCreateUser = () => {
    const userData = { email: 'rolssaacademy@gmail.com' };
    callCreateUserAndAssignRole(userData);
  };
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">{t('general-information')}</h3>
        <p className="text-sm text-muted-foreground">
          {t('this_is_how_others_will_see_your_school')} </p>
      </div>

      <Component/>
      <Separator />
      <ProfileForm />
     
    </div>
  )
}

export default SettingsProfilePage