
// Helper function to extract YouTube video ID

const { useState } = React;  // Get useState from React instead of importing

const getYouTubeVideoId = (url) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/watch\?.+&v=))([\w-]{11})/);
    return match ? match[1] : null;
};

const FileItem = ({ name, data, level = 0, onItemClick }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const hasChildren = data.items;
    const isLeafNode = !data.items && data.description;

    const handleClick = () => {
        if (hasChildren) {
            setIsOpen(!isOpen);
        } else if (isLeafNode) {
            onItemClick(data);
        }
    };

    return (
        <div className="font-mono">
            <div
                className={`flex items-center cursor-pointer hover:bg-gray-100 py-1 relative ${isLeafNode ? 'hover:text-blue-600' : ''}`}
                style={{ paddingLeft: `${level * 20}px` }}
                onClick={handleClick}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {hasChildren ? (
                    <img
                        src={isOpen ? '../images/icons/folder_open.svg' : '../images/icons/folder_closed.svg'}
                        alt={isOpen ? "Open folder" : "Closed folder"}
                        className="w-5 h-5 mr-2"
                    />
                ) : (
                    <span className="w-5 h-5 mr-2"> <img src={'../images/icons/chevron_right.svg'}/> </span>
                )}
                <span>{name}</span>

                {/* Hover preview */}
                {isHovered && data.image && isLeafNode && (
                    <div className="absolute left-full ml-2 z-50 bg-white rounded-lg shadow-lg p-2"
                         style={{ top: '50%', transform: 'translateY(-50%)' }}>
                        <img
                            src={data.image}
                            alt={name}
                            className="w-32 h-32 object-cover rounded"
                        />
                    </div>
                )}
            </div>

            {/* Only render children if folder is open */}
            {isOpen && hasChildren && (
                <div>
                    {data.items.map((item) => (
                        <FileItem
                            key={item.id}
                            name={item.name}
                            data={item}
                            level={level + 1}
                            onItemClick={onItemClick}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

const ResourcesPage = () => {
    const [selectedItem, setSelectedItem] = useState(null);

    const handleItemClick = (item) => {
        setSelectedItem(item);
        window.scrollTo({ top: 250, behavior: 'smooth' });
    };

    return (
        <div className="min-h-screen">
            <div className="flex">
                {/* File system navigation - left side */}
                <div className="w-1/3 p-4 border-r">
                    <div className="space-y-2">
                        {Object.entries(projectsData).map(([key, category]) => (
                            <FileItem
                                key={key}
                                name={category.title}
                                data={category}
                                onItemClick={handleItemClick}
                            />
                        ))}
                    </div>
                </div>

                {/* Content display - right side */}
                <div className="w-2/3 p-8">
                    {selectedItem ? (
                        <article>
                            <div className="flex items-start gap-6 mb-6">
                                {selectedItem.image && (
                                    <img
                                        src={selectedItem.image}
                                        alt={selectedItem.name}
                                        className="w-48 h-48 object-cover rounded-lg"
                                    />
                                )}
                                <div>
                                    <h2 className="text-2xl font-bold mb-2">{selectedItem.name}</h2>
                                    {selectedItem.role && (
                                        <div className="text-gray-600 mb-2">{selectedItem.role}</div>
                                    )}
                                    {selectedItem.category && (
                                        <div className="text-gray-600 mb-2">Category: {selectedItem.category}</div>
                                    )}
                                    {selectedItem.director && (
                                        <div className="text-gray-600 mb-2">By: {selectedItem.director}</div>
                                    )}
                                </div>
                            </div>

                            {selectedItem.videoUrl && (
                                <div className="aspect-w-16 aspect-h-9 mb-6">
                                    <iframe
                                        className="w-full h-96"
                                        src={`https://www.youtube.com/embed/${getYouTubeVideoId(selectedItem.videoUrl)}`}
                                        title={selectedItem.name}
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    ></iframe>
                                </div>
                            )}
                            <div
                                className="prose max-w-none"
                                dangerouslySetInnerHTML={{__html: selectedItem.description}}
                            />
                        </article>
                    ) : (
                        <div className="text-gray-500 ">
                            <p className="text-m/6 mb-8 text-gray-600">
                                Click on any category from the file system on the left to explore my curated collections
                                and resources.
                                Each section contains selected materials that have some relevance to me.
                            </p>
                            <hr></hr>

                            <img className="mt-8 ml-20"src="../images/resources/web.jpg" style={{width: '70%'}}/>

                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};


ReactDOM.render(<ResourcesPage/>, document.getElementById('root'));

