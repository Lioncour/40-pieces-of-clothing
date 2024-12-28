const ADMIN_KEY = 'Ctrl+Shift+A'; // or any combination you prefer
let isAdminMode = false;

document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        isAdminMode = !isAdminMode;
        document.getElementById('uploadZone').style.display = isAdminMode ? 'flex' : 'none';
        document.getElementById('adminIndicator').classList.toggle('active', isAdminMode);
        document.body.classList.toggle('admin-mode', isAdminMode);
    }
});

// Hide button by default
document.getElementById('uploadZone').style.display = 'none';

document.addEventListener('DOMContentLoaded', function() {
    let currentImageUrl = null;

    // Load saved items when page loads
    loadSavedItems();

    // Form handling
    const itemForm = document.getElementById('itemForm');
    const clothingForm = document.getElementById('clothingForm');
    const valueSlider = document.getElementById('itemValue');
    const valueDisplay = document.getElementById('valueDisplay');
    const cancelButton = document.getElementById('cancelForm');
    const addButton = document.getElementById('uploadZone');
    const fileInput = document.getElementById('fileInput');

    // Add click event to the add button
    addButton.addEventListener('click', () => {
        console.log('Add button clicked');
        fileInput.click();
    });

    // Handle file selection
    fileInput.addEventListener('change', (e) => {
        console.log('File selected');
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.type.startsWith('image/')) {
                currentImageUrl = URL.createObjectURL(file);
                itemForm.style.display = 'block';
                document.getElementById('itemName').focus();
            }
        }
    });

    // Update value display
    valueSlider.addEventListener('input', (e) => {
        valueDisplay.textContent = e.target.value;
    });

    // Handle form submission
    clothingForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('Form submitted');
        
        const formData = {
            name: document.getElementById('itemName').value,
            category: document.getElementById('itemCategory').value,
            description: document.getElementById('itemDescription').value,
            value: document.getElementById('itemValue').value
        };

        console.log('Form Data:', formData); // Debug log

        if (currentImageUrl) {
            try {
                const savedImageUrl = await saveImage(currentImageUrl);
                console.log('Saved Image URL:', savedImageUrl); // Debug log
                addClothingItem(savedImageUrl, formData);
                itemForm.style.display = 'none';
                clothingForm.reset();
                currentImageUrl = null;
            } catch (error) {
                console.error('Error saving item:', error);
            }
        }
    });

    // Handle cancel button
    cancelButton.addEventListener('click', () => {
        itemForm.style.display = 'none';
        clothingForm.reset();
        currentImageUrl = null;
    });

    function addClothingItem(imageUrl, formData) {
        console.log('Adding clothing item:', formData); // Debug log
        
        const newItem = createClothingItem({
            src: imageUrl,
            title: formData.name,
            category: formData.category,
            description: formData.description,
            value: formData.value
        });

        const sectionId = `${formData.category}-section`;
        console.log('Looking for section:', sectionId); // Debug log
        
        const grid = document.querySelector(`#${sectionId} .clothes-grid`);
        if (grid) {
            grid.appendChild(newItem);
            setupModalForItem(newItem);
            updateCategoryCount(formData.category);
            
            // Save the new item
            saveItem({
                src: imageUrl,
                title: formData.name,
                category: formData.category,
                description: formData.description,
                value: formData.value
            });
        } else {
            console.error('Could not find grid for category:', formData.category);
        }
    }

    function createClothingItem(data) {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'clothes-item';
        itemDiv.dataset.value = data.value;
        
        itemDiv.innerHTML = `
            <div class="delete-button">×</div>
            <div class="image-container">
                <img src="${data.src}" alt="${data.title}">
            </div>
            <div class="item-description">
                <h3>${data.title}</h3>
            </div>
            <div class="item-full-description" style="display: none;">
                ${data.description}
            </div>
        `;
        
        // Add delete functionality
        const deleteBtn = itemDiv.querySelector('.delete-button');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent modal from opening
            if (confirm('Are you sure you want to delete this item?')) {
                // Remove from DOM
                itemDiv.remove();
                
                // Remove from localStorage
                let items = JSON.parse(localStorage.getItem('deletedItems') || '[]');
                items.push(data.title); // Store deleted item titles
                localStorage.setItem('deletedItems', JSON.stringify(items));
                
                updateCategoryCount(data.category);
            }
        });
        
        return itemDiv;
    }

    // Modal functionality
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImage');
    const modalCaption = document.querySelector('.modal-caption');
    const closeBtn = document.querySelector('.modal-close');

    function setupModalForItem(item) {
        item.addEventListener('click', function() {
            const img = this.querySelector('img');
            const title = this.querySelector('h3').textContent;
            const desc = this.querySelector('.item-full-description').textContent;
            
            modal.classList.add('show');
            modalImg.src = img.src;
            modalCaption.innerHTML = `<h3>${title}</h3><p>${desc}</p>`;
            document.body.style.overflow = 'hidden';
        });
    }

    closeBtn.addEventListener('click', closeModal);

    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeModal();
        }
    });

    function closeModal() {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
    }

    // Add these new functions for data persistence
    function saveItem(itemData) {
        let savedItems = JSON.parse(localStorage.getItem('wardrobeItems') || '[]');
        savedItems.push({
            src: itemData.src,
            title: itemData.title,
            category: itemData.category,
            description: itemData.description,
            value: itemData.value
        });
        localStorage.setItem('wardrobeItems', JSON.stringify(savedItems));
    }

    function loadSavedItems() {
        // Get list of deleted items
        const deletedItems = JSON.parse(localStorage.getItem('deletedItems') || '[]');
        
        // Load items from data.js, excluding deleted ones
        wardrobeItems
            .filter(item => !deletedItems.includes(item.title))
            .forEach(itemData => {
                const newItem = createClothingItem(itemData);
                const sectionId = `${itemData.category}-section`;
                const grid = document.querySelector(`#${sectionId} .clothes-grid`);
                if (grid) {
                    grid.appendChild(newItem);
                    setupModalForItem(newItem);
                }
            });
        
        // Update all category counts
        ['tops', 'bottoms', 'outerwear', 'accessories', 'jewelry', 'workwear', 'training', 'other']
            .forEach(category => {
                updateCategoryCount(category);
            });
    }

    function saveImage(imageUrl) {
        return new Promise((resolve, reject) => {
            // If it's already a base64 string, return it
            if (imageUrl.startsWith('data:')) {
                resolve(imageUrl);
                return;
            }

            // Create a canvas to convert the image to base64
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.crossOrigin = 'anonymous';  // Add this line
            img.src = imageUrl;
            
            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                try {
                    const dataUrl = canvas.toDataURL('image/jpeg');
                    resolve(dataUrl);
                } catch (error) {
                    reject(error);
                }
            };

            img.onerror = (error) => {
                reject(error);
            };
        });
    }

    function updateCategoryCount(categoryId) {
        const section = document.getElementById(`${categoryId}-section`);
        if (section) {
            const grid = section.querySelector('.clothes-grid');
            const count = grid.children.length;
            const countSpan = section.querySelector('.item-count');
            const valueSpan = section.querySelector('.value-count');
            
            // Update item count
            if (countSpan) {
                countSpan.textContent = `(${count})`;
            }
            
            // Calculate and update total value
            if (valueSpan) {
                let totalValue = 0;
                Array.from(grid.children).forEach(item => {
                    const value = parseInt(item.dataset.value) || 0;
                    totalValue += value;
                });
                valueSpan.textContent = `💵 ${totalValue}`;
            }
        }
    }
}); 