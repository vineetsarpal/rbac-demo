// import { Button, Flex, Heading, HStack, Spacer } from '@chakra-ui/react'
// import { useRouter } from '@tanstack/react-router'
// import React from 'react'
// import { LuArrowLeft } from 'react-icons/lu'

// type Props = {
//     title: string
//     backTo?: string
//     backLabel?: string
//     actions?: React.ReactNode
// }

// function PageHeading(props: Props) {
//     const { title, backTo, backLabel = 'Back', actions } = props
//     const router = useRouter()
//   return (
//     <Flex align="center" mb={6} gap={4}>
//       <HStack gap={4}>
//         {backTo && (
//           <Button
//             variant="ghost"
//             onClick={() => router.navigate({ to: backTo })}
//           >
//             <LuArrowLeft />
//             {backLabel}
//           </Button>
//         )}
//         <Heading size="lg">{title}</Heading>
//       </HStack>
      
//       <Spacer />

//       {actions && (
//         <HStack gap={4}>
//           {actions}
//         </HStack>
//       )}
//     </Flex>
//   )
// }

// export default PageHeading