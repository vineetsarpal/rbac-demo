import { useAuth } from '@/contexts/AuthContext'
import { Box, Flex, VStack, IconButton, Text, } from '@chakra-ui/react'
import { Link, useMatchRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { LuUsers, LuShield, LuBoxes, LuChevronsLeft, LuBuilding2, LuChevronsRight } from 'react-icons/lu'

function Sidebar() {
  const { currentUser } = useAuth()
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Use useMatchRoute to detect active routes
  const matchRoute = useMatchRoute()

  // Helper function to check if the user has a specific permission
  const hasPermission = (permission: string): boolean => {
    return !!currentUser && currentUser.permissions.includes(permission)
  }

  const navItems = [
    { to: '/dashboard/organizations', label: 'Organizations', icon: LuBuilding2, requiredPermission: 'read:organizations', platformOnly: true },
    { to: '/dashboard/users', label: 'Users', icon: LuUsers, requiredPermission: 'read:users' },
    { to: '/dashboard/roles', label: 'Roles', icon: LuShield, requiredPermission: 'read:roles' },
    { to: '/dashboard/items', label: 'Items', icon: LuBoxes, requiredPermission: 'read:items' },
  ]

  // Filter navItems based on user permissions
  const filteredNavItems = navItems.filter(item => {
    if (item.requiredPermission) {
      if (!hasPermission(item.requiredPermission)) {
        return false
      }
    }

    // If item is specifically marked as platformOnly, only show if current_user is platform admin
    if (item.platformOnly && !currentUser?.is_platform_admin) {
        return false // Hide if it's platform only and user isn't platform admin
    }

    return true // Otherwise, show the item
  })


  // Toggle collapse state for desktop
  const toggleCollapse = () => setIsCollapsed(!isCollapsed)


  return (
    <>
      {/* Desktop: Sidebar */}
      <Box
        display={{ base: 'none', md: 'block' }}
        position="relative"
        top={0}
        left={0}
        h="100vh" // Ensure this sidebar container itself has a height
        w={isCollapsed ? '80px' : '250px'}
        borderRight="1px"
        transition="width 0.2s ease"
        zIndex="docked"
        overflow="hidden" // Hides content that exceeds width during collapse transition
      >
        <Flex
          direction="column"
          h="full"
          p={isCollapsed ? 2 : 4}
        >
          {/* Collapse Toggle Button */}
          <Flex justify={isCollapsed ? 'center' : 'flex-end'} mb={2}>
            <IconButton
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              variant="ghost"
              onClick={toggleCollapse}
              size="sm"
            >
              {isCollapsed ? <LuChevronsRight /> : <LuChevronsLeft />}
            </IconButton>
          </Flex>

          {/* Navigation Items */}
          <VStack align="start" gap={2} flex={1}>
            {filteredNavItems.map((item) => { // <--- Use filteredNavItems here
              const isActive = !!matchRoute({ to: item.to })
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  style={{ width: '100%' }}
                >
                  <Flex
                    align="center"
                    p={3}
                    borderRadius="md"
                    w="100%"
                    fontWeight={isActive ? 'semibold' : 'normal'}
                  >
                    <item.icon size={20} style={{ marginRight: isCollapsed ? 0 : 12 }} />
                    {!isCollapsed && <Text fontSize="md">{item.label}</Text>}
                  </Flex>
                </Link>
              )
            })}
          </VStack>
          {/* Add a spacer or footer here if needed */}
        </Flex>
      </Box>

      {/* Spacer to prevent content overlap on desktop - This should remain */}
      <Box
        display={{ base: 'none', md: 'block' }}
        w={isCollapsed ? '80px' : '250px'}
        flexShrink={0}
      />
    </>
  )
}

export default Sidebar