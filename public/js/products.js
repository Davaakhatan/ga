const productForm = document.getElementById('student-form');
const productsList = document.getElementById('productsList');
const URL = 'http://localhost:3000/api/products'; // use it if you run "npm run dev"

// Read
const fetchProducts = async () => {
    try {
        const response = await fetch(URL);
        if (!response.ok) {
            throw new Error('Something went wrong!');
        }
        const data = await response.json();
        let output = '';
        console.log(data?.[0])
        data.forEach(function (product) {
            output += `
                <tr id=${product?._id}>
                    <td><img src="data:image/jpeg;base64,${product.imageUrl}" alt="${product.name}" style="width: 100px; height: 50px;"></td>
                    <td>${product?.productCode}</td>
                    <td>${product?.name}</td>
                    <td>${product?.price}</td>
                    <td>${product?.inventory}</td>
                    <td>
                        <button class="btn btn-warning btn-sm edit" onclick="editItem('${product?._id}')">Edit</button>
                        <button class="btn btn-danger btn-sm delete" onclick="deleteItem('${product?._id}')">Delete</button>
                    </td> 
                </tr>
            `;
        });
        productsList.innerHTML = output;
    } catch (error) {
        console.error('There was a problem with the fetch operation:', error);
    }
};

// Delete
function deleteItem(id) {
    if (confirm('Are you sure you want to delete this item?')) {
        fetch(`${URL}/${id}`, {
            method: 'DELETE'
        })
            .then(response => {
                if (response.ok) {
                    fetchProducts(); // Refresh table after successful deletion
                } else {
                    throw new Error('Failed to delete item');
                }
            })
            .catch(error => console.error('Error deleting item:', error));
    }
}
function editItem(id) {
    const item = document.getElementById(`${id}`).querySelectorAll('td');
    document.getElementById('productId').value = `${id}`;
    document.getElementById('productCode').value = item[1].textContent;
    document.getElementById('name').value = item[2].textContent;
    document.getElementById('price').value = item[3].textContent;
    document.getElementById('inventory').value = item[4].textContent;
    document.querySelector('form').querySelector('input[type="submit"]').style.backgroundColor = '#ffc107';
    document.querySelector('form').querySelector('input[type="submit"]').value = 'Update';

    // Create and append the cancel button
    const cancelButton = `<button class="btn btn-light" id="cancelBtn">Cancel</button>`;
    const formActions = document.getElementById('actions');
    const cancelBtn = document.getElementById('cancelBtn');
    if (cancelBtn === null) {
        formActions.innerHTML += cancelButton;
    }
}

const convertToBase64 = () => {
    const fileInput = document.getElementById('image');
    const file = fileInput.files[0];

    if (file) {
        const reader = new FileReader();
        reader.readAsDataURL(file);

        reader.onload = function () {
            const base64String = reader.result.split(',')[1];
            // document.getElementById('base64-output').textContent = base64String;
            // console.log(base64String);
        };

        reader.onerror = function (error) {
            console.error('Error reading the file:', error);
        };
    } else {
        console.error('No file selected');
    }
}
// Submit form (Add)
const submitProductForm = async (e) => {
    e.preventDefault();
    try {
        let id = document.getElementById('productId').value;
        let productCode = document.getElementById('productCode').value;
        let name = document.getElementById('name').value;
        let price = document.getElementById('price').value;
        let inventory = document.getElementById('inventory').value;
        // Update 
        if (id) {
            const response = await fetch(`${URL}/${id}`, {
                method: "PATCH",
                headers: {
                    'Accept': 'application/json, text/plain, */*',
                    'Content-type': 'application/json'
                },
                body: JSON.stringify({ name, price, inventory, productCode })
            });
            if (!response.ok) {
                throw new Error('Something went wrong!');
            }
        } else {
            // Create
            // const FormData = require('form-data')
            // const formData = new FormData();
            // formData.append('productCode', productCode);
            // formData.append('name', name);
            // formData.append('price', price);
            // formData.append('inventory', inventory);
            // console.log(formData);
            // // formData.append('image', document.getElementById('image').files[0]);
            const imageString = await convertToBase64();
            console.log(name, price, inventory, productCode)
            const response = await fetch(URL, {
                method: "POST",
                headers: {
                    'Accept': 'application/json, text/plain, */*',
                    'Content-type': 'application/json'
                },
                body: JSON.stringify({ name, price, inventory, productCode, imageUrl: imageString })
            });
            console.log(response)
            if (!response.ok) {
                throw new Error('Something went wrong!');
            }

        }
    } catch (error) {
        console.error('There was a problem with the fetch operation:', error);
    }
};
productForm.addEventListener('submit', submitProductForm);

const handleDOMContentLoaded = () => {
    fetchProducts();
};

document.addEventListener('DOMContentLoaded', handleDOMContentLoaded);
