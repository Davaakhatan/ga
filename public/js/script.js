const userForm = document.getElementById('student-form');
const usersList = document.getElementById('usersList');
// const URL = 'http://localhost:85/api/users'; // use it if you use docker on your local machine
const URL = 'http://localhost:3001/api/users'; // use it if you run "npm run dev"
// const URL = 'https://shiirevvapi.lafrime.monster/api/users'; // use it if you deployed on code server

// Read
const fetchUsers = async () => {
    try {
        const response = await fetch(URL);
        if (!response.ok) {
            throw new Error('Something went wrong!');
        }
        const data = await response.json();
        let output = '';
        data.forEach(function (user) {
            output += `
                <tr id=${user?._id}>
                    <td>${user?.name}</td>
                    <td>${user?.age}</td>
                    <td>${user?.country}</td>
                    <td>
                        <button class="btn btn-warning btn-sm edit" onclick="editItem('${user?._id}')">Edit</button>
                        <button class="btn btn-danger btn-sm delete" onclick="deleteItem('${user?._id}')">Delete</button>
                    </td> 
                </tr>
            `;
        });
        usersList.innerHTML = output;
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
                    fetchUsers(); // Refresh table after successful deletion
                } else {
                    throw new Error('Failed to delete item');
                }
            })
            .catch(error => console.error('Error deleting item:', error));
    }
}
function editItem(id) {
    const item = document.getElementById(`${id}`).querySelectorAll('td');
    document.getElementById('userId').value = `${id}`;
    document.getElementById('name').value = item[0].textContent;
    document.getElementById('age').value = item[1].textContent;
    document.getElementById('country').value = item[2].textContent;
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
// Submit form (Add)
const submitUserForm = async (e) => {
    // e.preventDefault();
    try {
        let id = document.getElementById('userId').value;
        let name = document.getElementById('name').value;
        let age = document.getElementById('age').value;
        let country = document.getElementById('country').value;
        // Update 
        if (id) {
            const response = await fetch(`${URL}/${id}`, {
                method: "PATCH",
                headers: {
                    'Accept': 'application/json, text/plain, */*',
                    'Content-type': 'application/json'
                },
                body: JSON.stringify({ name, age, country })
            });
            if (!response.ok) {
                throw new Error('Something went wrong!');
            }
        } else {
            // Create
            const response = await fetch(URL, {
                method: "POST",
                headers: {
                    'Accept': 'application/json, text/plain, */*',
                    'Content-type': 'application/json'
                },
                body: JSON.stringify({ name, age, country })
            });
            if (!response.ok) {
                throw new Error('Something went wrong!');
            }

        }
    } catch (error) {
        console.error('There was a problem with the fetch operation:', error);
    }
};
userForm.addEventListener('submit', submitUserForm);

const handleDOMContentLoaded = () => {
    fetchUsers();
};

document.addEventListener('DOMContentLoaded', handleDOMContentLoaded);
