<script>
    import { onMount } from 'svelte'; // Import the onMount lifecycle function from Svelte

    let friends = []; // Define an array to hold the list of friends
    let newFriend = { first_name: '', last_name: '', age: '', city: '', state: '' }; // Define an object to hold the new friend's details
    let apiUrl = 'http://localhost:3000/friends'; // Define the base URL for the API
    let errorMessage = ''; // Define a variable to hold error messages

    // Fetch friends from API (GET request)
    async function fetchFriends() {
        const response = await fetch(apiUrl); // Make a GET request to the API endpoint
        friends = await response.json(); // Parse the response as JSON and assign it to the friends array
    }

    // Add a new friend (POST request)
    async function addFriend() {
        // Check if all fields of the new friend are filled
        if (newFriend.first_name.trim() && newFriend.last_name.trim() && newFriend.age && newFriend.city.trim() && newFriend.state.trim()) {
            errorMessage = ''; // Clear any previous error messages
            const response = await fetch(apiUrl, {
                method: 'POST', // Specify the request method as POST
                headers: { 'Content-Type': 'application/json' }, // Set the request headers to indicate JSON content
                body: JSON.stringify(newFriend) // Convert the new friend object to JSON and send it in the request body
            });
            if (response.ok) { // If the response is OK (status 200-299)
                newFriend = { first_name: '', last_name: '', age: '', city: '', state: '' }; // Reset the new friend object to empty
                await fetchFriends(); // Fetch the updated list of friends
            } else {
                console.error('Failed to add friend'); // Log an error message if the request failed
            }
        } else {
            errorMessage = 'All fields are required.'; // Set an error message if validation fails
        }
    }

    // Update a friend (PUT request)
    async function updateFriend(id) {
        const friendToUpdate = friends.find(friend => friend.id === id);
        const updatedFriend = { ...friendToUpdate };

        updatedFriend.first_name = prompt('Update First Name', friendToUpdate.first_name) || friendToUpdate.first_name;
        updatedFriend.last_name = prompt('Update Last Name', friendToUpdate.last_name) || friendToUpdate.last_name;
        updatedFriend.age = prompt('Update Age', friendToUpdate.age) || friendToUpdate.age;
        updatedFriend.city = prompt('Update City', friendToUpdate.city) || friendToUpdate.city;
        updatedFriend.state = prompt('Update State', friendToUpdate.state) || friendToUpdate.state;

        const response = await fetch(`${apiUrl}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedFriend)
        });

        if (response.ok) {
            await fetchFriends(); // Fetch and render the updated list to maintain order
        } else {
            console.error('Failed to update friend');
        }
    }


    // Delete a friend (DELETE request)
    async function deleteFriend(id) {
        const response = await fetch(`${apiUrl}/${id}`, {
            method: 'DELETE' // Specify the request method as DELETE
        });
        if (response.ok) { // If the response is OK
            await fetchFriends(); // Fetch the updated list of friends
        } else {
            console.error('Failed to delete friend'); // Log an error message if the request failed
        }
    }

    onMount(fetchFriends); // Fetch the list of friends when the component is mounted
</script>

<div>
    <h2>Add a new friend</h2>
    {#if errorMessage}
        <p style="color: red;">{errorMessage}</p> <!-- Display the error message if it exists -->
    {/if}
    <input bind:value={newFriend.first_name} placeholder="First Name" /> <!-- Input for the friend's first name -->
    <input bind:value={newFriend.last_name} placeholder="Last Name" /> <!-- Input for the friend's last name -->
    <input bind:value={newFriend.age} type="number" placeholder="Age" /> <!-- Input for the friend's age -->
    <input bind:value={newFriend.city} placeholder="City" /> <!-- Input for the friend's city -->
    <input bind:value={newFriend.state} placeholder="State" /> <!-- Input for the friend's state -->
    <button on:click={addFriend}>Add</button> <!-- Button to add the new friend -->
</div>

<h2>Friends List</h2>
<ul>
    {#each friends as friend (friend.id)}
        <li class="friend-item">
            <span>{friend.first_name} {friend.last_name}, {friend.age}, {friend.city}, {friend.state}</span> <!-- Display the friend's details -->
            <div class="buttons">
                <button on:click={() => updateFriend(friend.id)}>Update</button> <!-- Button to update the friend -->
                <button on:click={() => deleteFriend(friend.id)}>Delete</button> <!-- Button to delete the friend -->
            </div>
        </li>
    {/each}
</ul>


<style>
    div {
        margin-bottom: 1em;
    }
    input {
        padding: 0.5em;
        margin-right: 0.5em;
    }
    button {
        padding: 0.5em;
    }
    ul {
        list-style: none;
        padding: 0;
    }
    li.friend-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin: 0.5em 0;
    }
    span {
        flex-grow: 1; /* Allow the span to grow to fill the available space */
        text-align: left; /* Center text inside the span */
        padding-left: 25em; /* Adjust this value to control spacing to the left */
    }
    .buttons {
        display: flex;
        gap: 0.5em;
        transform: translateX(-27em);
        margin-top: 1.1em;
    }
</style>