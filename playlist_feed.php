<?php
// Simple server-side proxy for YouTube playlist RSS feed.
// Usage: /playlist_feed.php?id=PLAYLIST_ID
// Returns JSON: {"ids":[...],"count":n}
// Note: Only public playlists. No caching implemented.

header('Content-Type: application/json; charset=utf-8');
$pid = isset($_GET['id']) ? trim($_GET['id']) : '';
if(!$pid){
  http_response_code(400);
  echo json_encode(['error'=>'missing id']);
  exit;
}
if(!preg_match('/^[A-Za-z0-9_-]+$/',$pid)){
  http_response_code(400);
  echo json_encode(['error'=>'bad id']);
  exit;
}
$url = 'https://www.youtube.com/feeds/videos.xml?playlist_id=' . $pid;
$xml = @file_get_contents($url);
if($xml === false){
  http_response_code(502);
  echo json_encode(['error'=>'fetch failed']);
  exit;
}
// Try DOM parsing first for robustness
$ids = [];
if(class_exists('DOMDocument')){
  libxml_use_internal_errors(true);
  $dom = new DOMDocument();
  if($dom->loadXML($xml)){
    $xpath = new DOMXPath($dom);
    // Register yt namespace if present
    $xpath->registerNamespace('yt','http://www.youtube.com/xml/schemas/2015');
    $nodes = $xpath->query('//yt:videoId');
    foreach($nodes as $n){ $ids[] = trim($n->textContent); }
  }
  libxml_clear_errors();
}
// Fallback regex if DOM failed or returned none
if(!$ids){
  if(preg_match_all('/<yt:videoId>([^<]+)<\/yt:videoId>/u',$xml,$m)){
    $ids = $m[1];
  }
}
$ids = array_values(array_unique(array_filter($ids,function($x){return $x !== ''; })));
echo json_encode(['ids'=>$ids,'count'=>count($ids)]);
