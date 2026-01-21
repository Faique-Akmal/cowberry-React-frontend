import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignInForm from "../../components/auth/SignInForm";

export default function SignIn() {
  return (
    <>
      <PageMeta
        title=" Welcome to Lantern - Sign In"
        description="Sign in to your lantern account"
      />
      <AuthLayout>
        <SignInForm />
      </AuthLayout>
    </>
  );
}
