<?php
// #region CORS Headers & Setup
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
// #endregion

// #region Input Validation & Parsing
if (!isset($_GET['url'])) {
    echo json_encode(['error' => 'No URL provided']);
    exit;
}

$targetUrl = $_GET['url'];

// Fix for newer cURL versions rejecting literal spaces in URLs
$targetUrl = str_replace(' ', '%20', $targetUrl);

// ensure its pointing to the NASA API
if (strpos($targetUrl, 'https://ssd.jpl.nasa.gov/api/') !== 0) {
    echo json_encode(['error' => 'Invalid target URL']);
    exit;
}
// #endregion

// #region cURL Request Execution
// Fetch and return the content
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $targetUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
// Disable SSL verification
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
// #endregion

// #region Response Logging & Caching
// Log API request and response data to a local directory
$logDir = __DIR__ . '/api_logs';
if (!is_dir($logDir)) {
    @mkdir($logDir, 0777, true);
}
if (is_dir($logDir)) {
    // Delete any log files in the directory that are older than 5 seconds.
    // This removes previous runs/batches while keeping files currently being fetched in this batch.
    $now = time();
    foreach (glob($logDir . '/*') as $file) {
        if (is_file($file) && ($now - filemtime($file) > 5)) {
            @unlink($file);
        }
    }

    $command = 'unknown';
    if (preg_match("/COMMAND='([^']+)'/", $targetUrl, $matches)) {
        $command = $matches[1];
    }
    // Decode the NASA response if it is JSON to extract the human-readable result
    $decodedResponse = json_decode($response, true);
    $resultText = (is_array($decodedResponse) && isset($decodedResponse['result'])) ? $decodedResponse['result'] : $response;

    $logContent = "=========================================\n";
    $logContent .= "TIMESTAMP : " . date('c') . "\n";
    $logContent .= "TARGET URL: " . $targetUrl . "\n";
    $logContent .= "HTTP CODE : " . $httpCode . "\n";
    if (curl_errno($ch)) {
        $logContent .= "CURL ERROR: " . curl_error($ch) . "\n";
    }
    $logContent .= "=========================================\n\n";
    $logContent .= $resultText;

    $logFile = $logDir . '/response_' . date('Ymd_His') . '_' . $command . '.txt';
    @file_put_contents($logFile, $logContent);
}
// #endregion

// #region Output Response & Cleanup
if (curl_errno($ch)) {
    echo json_encode(['error' => curl_error($ch)]);
} else {
    http_response_code($httpCode);
    echo $response;
}
curl_close($ch);
// #endregion
?>
