import { Theme, ThemeExtension, extendTheme } from "@chakra-ui/react"
import { getFontDefinitionFromNetwork } from "next/dist/server/font-utils"


export const theme = extendTheme({
    config: {
        initialColorMode: 'dark',
        useSystemColorMode: false,
    },
    styles: {
        global: {
            'html, body': {
                background: "url('/bg.png') 0 0 / cover no-repeat;",
                minHeight: "100vh"
            },
        },
    },
    colors: {
        brand: {
            100: "#f7fafc",
            900: "#1a202c",
        },
    },
    components: {
        Tabs: {
            defaultProps: {
                variant: "unstyled",
                colorScheme: false,
            },
            baseStyle: {
                tablist: {
                    gap: "1rem"
                },
                tab: {
                    border: "1px solid #555",
                    borderRadius: "md",
                    opacity: .7,
                    backdropFilter: "blur(10px)",
                    bg: "linear-gradient(111.77deg, rgba(2, 177, 170, 0.0) -16.98%, rgba(0, 0, 0, 0.0) 111.71%)",
                    _selected: {
                        border: "1px solid #004f3d",
                        opacity: 1,
                        bg: "linear-gradient(111.77deg, rgba(2, 177, 170, 0.3) -16.98%, rgba(0, 0, 0, 0.3) 111.71%)",
                    }
                },
            }
        }
    }
})