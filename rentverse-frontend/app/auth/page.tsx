import ContentWrapper from '@/components/ContentWrapper'
import ModalEmailCheck from '@/components/ModalEmailCheck'
import AuthGuard from '@/components/AuthGuard'

export default function AuthPage() {
  return (
    <AuthGuard requireAuth={false} redirectTo="/">
      <div>
        <ContentWrapper>
          <ModalEmailCheck isModal={false} />
        </ContentWrapper>
      </div>
    </AuthGuard>
  )
}
