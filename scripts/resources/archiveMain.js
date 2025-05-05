// archiveMain.js - Main application logic for loading and displaying archive data

const { useState, useEffect } = React;
const { FileItem, ContentDisplay } = window.ArchiveComponents;

const ArchiveApp = () => {
    const [contentData, setContentData] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Load data from the generated JSON file
        fetch('../archiveData/content.json')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                setContentData(data);
                setLoading(false);
            })
            .catch(error => {
                console.error('Error loading data:', error);
                setError(error.message);
                setLoading(false);
            });
    }, []);

    const handleItemClick = (item) => {
        setSelectedItem(item);
        window.scrollTo({ top: 250, behavior: 'smooth' });
    };

    if (loading) {
        return <div className="flex justify-center p-8">Loading archive content...</div>;
    }

    if (error) {
        return (
            <div className="flex justify-center p-8 text-red-600">
                Error loading archive content: {error}
                <br />
                <small>Make sure to run the archiveBuild.js script to generate the content JSON file.</small>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            <div className="flex flex-col md:flex-row">
                {/* File system navigation - left side */}
                <div className="w-full md:w-1/3 p-4 border-r">
                    <div className="space-y-2">
                        {contentData && Object.values(contentData).map((category) => (
                            <FileItem
                                key={category.id}
                                name={category.title}
                                data={category}
                                onItemClick={handleItemClick}
                            />
                        ))}
                    </div>
                </div>

                {/* Content display - right side */}
                <div className="w-full md:w-2/3 p-8">
                    <ContentDisplay item={selectedItem} />
                </div>
            </div>
        </div>
    );
};

// Render the app
ReactDOM.render(<ArchiveApp />, document.getElementById('root'));