// Global type declarations for the application

interface MaterialKit {
    input?: () => void;
    initFormInputs?: () => void;
}

declare global {
    interface Window {
        materialKit?: MaterialKit;
    }
}

export { };