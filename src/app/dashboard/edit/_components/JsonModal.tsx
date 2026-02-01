import Modal from "@/app/components/ui/Modal";
import { EditorComponents } from "@/lib/componentOptimization";
import { Resume, getSanitizedResume } from "@/store/useResumeStore";
import { FaDownload } from "react-icons/fa";

const ReactJsonView = EditorComponents.JsonViewer;

interface JsonModalProps {
    isJsonModalOpen: boolean;
    closeJsonModal: () => void;
    handleDownloadJson: () => void;
    activeResume: Resume;
    t: (key: string) => string;
}

export default function JsonModal({ isJsonModalOpen, closeJsonModal, handleDownloadJson, activeResume, t }: JsonModalProps) {
    return (
        <Modal
            isOpen={isJsonModalOpen} 
            onClose={closeJsonModal}
            title={t('mobileEdit.jsonData')}
        >
            <div className="relative">
                <button
                    onClick={handleDownloadJson}
                    className="absolute top-3 right-3 p-2 text-gray-400 rounded-md hover:bg-neutral-700 hover:text-white transition-colors"
                    aria-label="Download JSON file"
                >
                    <FaDownload />
                </button>
                <pre className="text-sm bg-[#1b1929] p-4 rounded-md overflow-x-auto h-[80vh] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                    {activeResume && (
                        <ReactJsonView 
                            src={getSanitizedResume(activeResume)} 
                            theme="monokai"
                            displayDataTypes={false} 
                            enableClipboard={false}
                            style={{ backgroundColor: 'transparent' }}
                        />
                    )}
                </pre>
            </div>
        </Modal>
    );
}