// archiveComponents.js - React components for the archive interface

// Video embedding component
const VideoEmbed = ({ video }) => {
    if (!video || video.type !== 'youtube') return null;

    return (
        <div className="video-responsive my-4">
            <iframe
                width="100%"
                height="315"
                src={`https://www.youtube.com/embed/${video.id}`}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={video.title || "Embedded video"}
            />
        </div>
    );
};

// File Item component - Displays a file/folder in the navigation tree
const FileItem = ({ name, data, level = 0, onItemClick }) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [isHovered, setIsHovered] = React.useState(false);
    const hasChildren = data.items && data.items.length > 0;
    const isLeafNode = !hasChildren && data.description;

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
                        src="../../images/icons/folder_open.svg"
                        alt={isOpen ? "Open folder" : "Closed folder"}
                        className="w-5 h-5 mr-2"
                        style={{ filter: isOpen ? 'none' : 'brightness(0.8)' }}
                    />
                ) : (
                    <span className="w-5 h-5 mr-2">
                        <img src="../../images/icons/chevron_right.svg" alt="Item" />
                    </span>
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

// Content Display component - Displays selected item details
// ContentDisplay.js - React component for displaying archive content with video support
const ContentDisplay = ({ item }) => {
    // Video embedding component
    const VideoEmbed = ({ videoId, title }) => {
        if (!videoId) return null;

        return (
            <div className="video-responsive my-6">
                <h3 className="text-lg font-medium mb-2">{title || "Embedded Video"}</h3>
                <div className="aspect-w-16 aspect-h-9">
                    <iframe
                        className="w-full h-96"
                        src={`https://www.youtube.com/embed/${videoId}`}
                        title={title || "Embedded Video"}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    ></iframe>
                </div>
            </div>
        );
    };

    if (!item) {
        return (
            <div className="text-gray-500">
                <p className="text-m/6 mb-8 text-gray-600">
                    Click on any category from the file system on the left to explore my curated collections
                    and resources. Each section contains selected materials that have some relevance to me.
                </p>
                <hr></hr>
                <img className="mt-8 ml-20" src="../../images/resources/web.jpg" style={{width: '70%'}} alt="Web illustration" />
            </div>
        );
    }

    return (
        <article>
            <div className="flex flex-col md:flex-row items-start gap-6 mb-6">
                {item.image && (
                    <img
                        src={item.image}
                        alt={item.name}
                        className="w-48 h-48 object-cover rounded-lg"
                    />
                )}
                <div>
                    <h2 className="text-2xl font-bold mb-2">{item.name}</h2>
                    {item.role && (
                        <div className="text-gray-600 mb-2">{item.role}</div>
                    )}
                    {item.category && (
                        <div className="text-gray-600 mb-2">Category: {item.category}</div>
                    )}
                    {item.director && (
                        <div className="text-gray-600 mb-2">Director: {item.director}</div>
                    )}
                </div>
            </div>

            {/* Video embeds */}
            {item.videoEmbed && (
                <VideoEmbed
                    videoId={item.videoEmbed.id}
                    title={item.videoEmbed.title}
                />
            )}

            {/* Alternative video embed using youtubeId field */}
            {!item.videoEmbed && item.youtubeId && (
                <VideoEmbed
                    videoId={item.youtubeId}
                    title={item.name}
                />
            )}

            {/* Render description as HTML */}
            <div
                className="prose max-w-none mt-4"
                dangerouslySetInnerHTML={{__html: item.description}}
            />
        </article>
    );
};

// Export components
window.ArchiveComponents = {
    FileItem,
    ContentDisplay
};