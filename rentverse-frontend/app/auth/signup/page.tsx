import ContentWrapper from '@/components/ContentWrapper'
import ModalSignUp from '@/components/ModalSignUp'
import AuthGuard from '@/components/AuthGuard'

export default function AuthPage() {
  return (
    <AuthGuard requireAuth={false} redirectTo="/">
      <div>
        <ContentWrapper>
          <ModalSignUp isModal={false} />
        </ContentWrapper>
      </div>
    </AuthGuard>
  )
}
