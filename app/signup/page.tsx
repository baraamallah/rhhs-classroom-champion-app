import { getUserCount } from "@/lib/first-user"
import SignupForm from "@/components/features/auth/signup-form"

export default async function SignUpPage() {
  let isFirstUser = false
  try {
    isFirstUser = (await getUserCount()) === 0
  } catch (error) {
    console.error("Could not check initial setup status", error)
  }
  return <SignupForm isFirstUser={isFirstUser} />
}
