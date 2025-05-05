const { useState, useRef, useEffect } = React;

const FileLayout = () => {
    const [activeFile, setActiveFile] = useState(null);
    const [scrollPosition, setScrollPosition] = useState(0);

    const lectureTopics = [
        {
            id: 'Algorithms',
            title: 'Algorithms',
            description: 'Study of algorithms, their implementation and complexity analysis',
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
            description: 'Principles and applications of AI and machine learning',
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
            description: 'Techniques for parallel program execution and design',
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
            description: 'Advanced techniques for high-performance applications',
            topics: [
                {
                    name: 'HPC Crash Course',
                    ref: '../learning/HPC/HPC.html'
                }
            ]
        }
    ];

    useEffect(() => {
        const container = document.getElementById('file-container');
        const handleScroll = () => {
            setScrollPosition(container.scrollTop);
        };

        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }, []);

    const handleFileClick = (id) => {
        setActiveFile(activeFile === id ? null : id);
    };

    return (
        <div className="mt-16 min-h-screen bg-gray-100 py-12 px-4">
            <div
                id="file-container"
                className="max-w-6xl mx-auto overflow-y-auto"
                style={{
                    height: '85vh',
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#CBD5E0 #EDF2F7',
                }}
            >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {lectureTopics.map((file, index) => {
                        const isActive = activeFile === file.id;
                        const zIndex = lectureTopics.length - index;

                        return (
                            <div key={file.id} className="relative">
                                <div
                                    className={`cursor-pointer transition-all duration-300 relative ${
                                        isActive ? 'transform -translate-y-2 shadow-xl' : 'hover:opacity-90 shadow-sm hover:shadow-md'
                                    }`}
                                    onClick={() => handleFileClick(file.id)}
                                    style={{ zIndex: isActive ? 100 : zIndex }}
                                >
                                    {isActive && (
                                        <div className="absolute -top-2 -right-2 w-4 h-4 bg-green-500 rounded-full border-2 border-white z-10"></div>
                                    )}
                                    <div className="bg-white border border-gray-300 rounded shadow-sm overflow-hidden">
                                        <div className="relative">
                                            <img
                                                src="../images/file.png"
                                                alt="File"
                                                className="w-full h-64 object-contain p-2"
                                            />

                                            <div className="absolute top-0 left-0 right-0 border-b border-gray-300 bg-white bg-opacity-90 py-2">
                                                <h3 className="text-lg font-semibold text-gray-800 text-center uppercase">{file.id}</h3>
                                            </div>

                                            <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300">
                                                <div className="text-white p-6 text-center">
                                                    <h4 className="text-lg font-semibold mb-2">{file.title}</h4>
                                                    <p className="text-sm">{file.description}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {isActive && (
                                    <div className="mt-2 bg-white border border-gray-300 rounded shadow-lg p-0 transition-all duration-300 ease-in-out z-10 overflow-hidden">
                                        <div className="bg-gray-200 p-2 border-b border-gray-300">
                                            <h4 className="font-semibold text-gray-800 text-sm">TOPICS</h4>
                                        </div>
                                        <ul className="divide-y divide-gray-200">
                                            {file.topics.map((topic, i) => (
                                                <li key={i} className="hover:bg-gray-50 transition-colors">
                                                    <a
                                                        href={topic.ref}
                                                        className="block px-4 py-3 text-gray-700 hover:text-blue-700 flex items-center"
                                                        target="_blank"
                                                    >
                                                        <span className="flex-grow">{topic.name}</span>
                                                        <span className="text-xs text-gray-500 ml-2">→</span>
                                                    </a>
                                                </li>
                                            ))}
                                        </ul>
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
root.render(<FileLayout />);