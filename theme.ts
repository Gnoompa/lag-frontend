import { extendTheme } from "@chakra-ui/react"


export const theme = extendTheme({
    config: {
        initialColorMode: 'dark',
        useSystemColorMode: false,
    },
    fonts: {
        body: '"KoHo", sans-serif',
    },
    styles: {
        global: {
            'html, body': {
                background: "black",
                minHeight: "100vh"
            },           
        },
    },
    semanticTokens: {
        colors: {
            black: '#0E1111',
            white: "#FAFAFA"
        }
    },
    components: {
        Button: {
            variants: {
                accent: {
                    bg: "white",
                    color: "black",
                    fontWeight: "bold",
                    border: "1px solid black",
                    boxShadow: "0px 4px 0px white",
                    _active: {
                        boxShadow: "0px 0px 0px white",
                    },
                    _hover: {
                        _disabled: {
                            bg: "white"
                        }
                    }
                },
                secondary: {
                    bg: "black",
                    color: "white",
                    _hover: {
                        _disabled: {
                            bg: "black"
                        }
                    }
                },
            }
        },
        Container: {
            variants: {
                accent: {
                    bg: "white",
                    p: ".5rem 1rem",
                    borderRadius: "lg",
                    border: "1px solid black",
                    boxShadow: "0px 4px 0px white"
                },
                tooltip: {
                    bg: "white",
                    color: "black",
                    borderRadius: "full",
                    p: ".5rem",
                    border: "2px solid black",
                }
            }
        },
        Text: {
            variants: {
                accent: {
                    letterSpacing: "0.14em",
                    color: "white",
                    "-webkit-text-stroke": "2px black",
                    fontWeight: "bold",
                    textShadow: "0px 4px 0px white"
                }
            }
        },
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