import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignInForm from "../../components/auth/SignInForm";

export default function SignIn() {
  return (
    <>
      <PageMeta
        title=" Welcome to Cowberry SignIn"
        description="Sign in to your Cowberry account"
      />
      <AuthLayout>
        <SignInForm />
      </AuthLayout>
    </>
  );
}
