<?php
session_start();
if (!isset($_SESSION['username'])) {
    header("Location: login.php");
    exit;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Budget Management System - DLSU</title>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: 'Montserrat', sans-serif;
    }
    
    .react-container {
      min-height: 100vh;
    }
    
    .loading {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      font-size: 18px;
      color: #333;
    }
  </style>
</head>
<body>
  <div id="root">
    <div class="loading">Loading React Application...</div>
  </div>
  
  <!-- Load React from CDN for development -->
  <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react.development.js"></script>
  <script src="https://unpkg.com/react-router-dom@6.8.1/dist/umd/react-router-dom.development.js"></script>
  
  <script>
    // Pass PHP session data to React
    window.initialData = {
      user: {
        id: <?php echo $_SESSION['user_id'] ?? 'null'; ?>,
        username: '<?php echo addslashes($_SESSION['username'] ?? ''); ?>',
        role: '<?php echo addslashes($_SESSION['role'] ?? ''); ?>',
        name: '<?php echo addslashes($_SESSION['name'] ?? $_SESSION['username'] ?? ''); ?>'
      },
      authenticated: true
    };
  </script>
  
  <!-- Load our React components -->
  <script type="module" src="/src/main.jsx"></script>
</body>
</html>
