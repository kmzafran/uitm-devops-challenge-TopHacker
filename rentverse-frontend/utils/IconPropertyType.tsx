import type { IconBaseProps } from 'react-icons'
import { PropertyType } from '@/types/property'
import { TbBuildingEstate, TbBuildingCottage, TbBuilding, TbBuildingSkyscraper } from 'react-icons/tb'
import { BiHome } from 'react-icons/bi'
import { MdOutlineVilla } from 'react-icons/md'

function IconPropertyType({ property_type, ...props }: {
  property_type: PropertyType
} & IconBaseProps) {
  switch (property_type) {
    case 'condominium':
      return <TbBuildingEstate {...props} />
    case 'apartment':
      return <TbBuilding {...props} />
    case 'house':
      return <BiHome {...props} />
    case 'townhouse':
      return <TbBuildingCottage {...props} />
    case 'villa':
      return <MdOutlineVilla {...props} />
    case 'penthouse':
      return <TbBuildingSkyscraper {...props} />
    default:
      return <TbBuildingEstate {...props} />
  }
}

export default IconPropertyType
