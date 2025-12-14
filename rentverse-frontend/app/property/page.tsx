import ListFeatured from '@/components/ListFeatured'
import ContentWrapper from '@/components/ContentWrapper'
import ListPopularLocation from '@/components/ListPopularLocation'

function ListsPage() {
  return (
    <ContentWrapper searchBoxType="full">
      <ListFeatured />
      <ListPopularLocation />
    </ContentWrapper>
  )
}

export default ListsPage
