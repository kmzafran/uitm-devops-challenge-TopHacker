import ContentWrapper from '@/components/ContentWrapper'
import ModalLogIn from '@/components/ModalLogIn'
import AuthGuard from '@/components/AuthGuard'

export default function AuthPage() {
  return (
    <AuthGuard requireAuth={false} redirectTo="/">
      <div>
        <ContentWrapper>
          <ModalLogIn isModal={false} />
        </ContentWrapper>
      </div>
    </AuthGuard>
  )
}
