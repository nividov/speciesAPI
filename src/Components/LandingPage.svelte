<script>
    import { newRequest } from "../Modules/requestHandling"

</script>



<form on:submit|preventDefault={newRequest} >
    <div>Your request</div>
    <input type="text" name="latName">
</form>