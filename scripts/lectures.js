const { useState, useRef, useEffect } = React;

const FolderLayout = () => {
    const [activeFolder, setActiveFolder] = useState(null);
    const [scrollPosition, setScrollPosition] = useState(0);

    const lectureTopics = [
        {
            id: 'Algorithms',
            title: 'Algorithms',
            topics: [
                {
                    name: 'Algorithms Overview',
                    ref: '../learning/alg/alg.html'
                }
            ]
        },
        {
            id: 'AI/ML',
            title: 'Artificial Intelligence and Machine Learning',
            topics: [
                {
                    name: 'Machine Learning Crash Course',
                    ref: '../learning/ml/machine_learning.html'
                }
            ]
        },
        {
            id: 'Parallel',
            title: 'Parallel Computing',
            topics: [
                {
                    name: 'Parallel Programming',
                    ref: '../learning/parallel/parallel.html'
                },
                {
                    name: 'GoLang Crash Course',
                    ref: '../learning/parallel/go.html'
                }
            ]
        },
        {
            id: 'HPC',
            title: 'High Performance Computing',
            topics: [
                {
                    name: 'HPC Crash Course',
                    ref: '../learning/HPC/HPC.html'
                }
            ]
        }
    ];

    useEffect(() => {
        const container = document.getElementById('folder-container');
        const handleScroll = () => {
            setScrollPosition(container.scrollTop);
        };

        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }, []);

    const handleFolderClick = (id) => {
        setActiveFolder(activeFolder === id ? null : id);
    };

    return (
        <div className="mt-16 min-h-screen bg-gray-200 border-blue-950 border py-4">
            <div
                id="folder-container"
                className="border border-gray-400 max-w-3xl mx-auto relative overflow-y-auto bg-gray-100 rounded-sm mt-8"
                style={{
                    height: '85vh',
                    perspective: '1000px',
                    transformStyle: 'preserve-3d',
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#CBD5E0 #EDF2F7',
                    '&::-webkit-scrollbar': {
                        width: '8px',
                    },
                    '&::-webkit-scrollbar-track': {
                        backgroundColor: '#EDF2F7',
                    },
                    '&::-webkit-scrollbar-thumb': {
                        backgroundColor: '#CBD5E0',
                        borderRadius: '4px',
                    }
                }}
            >
                <div className="relative pt-4 pb-40 mt-8">
                    {lectureTopics.map((folder, index) => {
                        const isActive = activeFolder === folder.id;
                        const offset = scrollPosition * 0.1;
                        const zIndex = lectureTopics.length - index;
                        const translateY = Math.max(0, (index * 40) - offset);

                        return (
                            <div
                                key={folder.id}
                                className="relative transition-all duration-300 ease-in-out px-4"
                                style={{
                                    transform: `translateY(${translateY}px)`,
                                    marginTop: '-10px',
                                    marginBottom: isActive ? '10px' : '0',
                                    zIndex: isActive ? 100 : zIndex
                                }}
                            >
                                <div
                                    onClick={() => handleFolderClick(folder.id)}
                                    className="relative cursor-pointer group"
                                >
                                    <div
                                        className={`p-2 border border-gray-400 rounded absolute inset-0 transition-all duration-300 ${
                                            isActive ? 'shadow-lg' : 'shadow-sm hover:shadow-md'
                                        }`}
                                        style={{
                                            clipPath: 'polygon(0 0, calc(100% - 30px) 0, 100% 100%, 0 100%)',
                                            background: 'linear-gradient(135deg, #fff0f0 0%, #e5e7eb 100%)',
                                            height: 'auto',
                                            transform: `translateZ(${index * 2}px)`
                                        }}
                                    />
                                    <div className="justify-items-end">
                                        <div
                                            className={`w-2 h-2 rounded-full border border-blue-500 ${isActive ? 'bg-green-500' : 'bg-gray-300'}`}/>
                                    </div>
                                    <div className="rounded-b-lg">
                                        <h3 className="ml-5 relative p-6 text-lg text-gray-800">
                                            {folder.id}
                                        </h3>
                                    </div>
                                </div>

                                {isActive && (
                                    <div
                                        className={"border border-gray-400 border-t-0 shadow-lg overflow-hidden rounded-b-lg"}
                                        style={{background: 'linear-gradient(135deg, #fff0f0 0%, #e5e7eb 100%)'}}>
                                        <div className="p-1">
                                            <div className="space-y-2">
                                                {folder.topics.map((topic, i) => (


                                                    <a href={topic.ref} target="_blank">
                                                        <div
                                                            key={i}
                                                            className="bg-stone-50 text-md pl-10 pt-5 pb-5 hover:bg-stone-100 transition-colors cursor-pointer rounded"
                                                        >
                                                            <span className="text-gray-600">{topic.name}
                                                                <i className="fas fa-external-link-alt mr-2"></i></span>
                                                    </div>
                                                    </a>
                                                    ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

// Initialize the app
const container = document.getElementById('root');
const root = ReactDOM.createRoot(container);
root.render(<FolderLayout />);