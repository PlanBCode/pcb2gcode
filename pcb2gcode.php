<?php
	if(!isset($_GET['action'])) return;

	switch($_GET['action']) 
	{
		case 'generateGCode':
		
			break;
		case 'loadFile':
			@readfile('generated/example/'.$_GET['fileName']);
			break;
		case 'downloadContent':
			$fileName = $_POST['type'];
			switch($_POST['type'])
			{
				case 'visualization':
					header('Content-type: image/svg+xml');
					$fileName .= '.svg';
					break;
			}
			header('Content-Disposition: attachment; filename="'.$fileName.'"');
			echo $_POST['content'];
			break;
		case 'downloadFile':
			header('Content-type: text/plain');
			header('Content-Disposition: attachment; filename="'.$_GET['fileName']);
			@readfile('generated/example/'.$_GET['fileName']);
			break;
		case 'checkFileExistence':
			$fileURL = 'generated/example/'.$_GET['fileName'];
			echo (file_exists($fileURL) && is_readable ($fileURL));
			break;
		case 'downloadAll':
			
			//$files = array('back.ngc','drill.ngc');
			//zipFilesAndDownload($files,'gcodes.zip','generated/example/');
			
			/*$targetFileNames = array(
			  'back.ngc',
			  'drill.ngc'
			);*/			
			$targetFileNames = getFiles('generated/example',array('ngc','png'),true);
			//print_r($targetFileNames);
			$targetFolder = 'generated/example/';
			$archiveFileName = 'allgcodes.zip';
			$result = createZip($targetFileNames,$archiveFileName,$targetFolder,true);
			
			header("Content-type: application/zip");
			header("Content-Disposition: attachment; filename=$archiveFileName");
			header("Pragma: no-cache");
			header("Expires: 0");
			readfile($targetFolder.$archiveFileName);
			
			break;
		/*case 'storeContentInFile':
			storeContentInFile&userID=example&fileName=back.ngc
			
			$fileName = 'generated/'.$_GET['userID'].'/'.$_GET['fileName'];
			$handle = fopen($fileName,'w');
			fwrite($handle, $_POST['content']);
			close($handle);
			break;*/
		case 'removeUserFiles':
		
			removeFiles('generated/'.$_GET['userID']);
			
			break;
		case 'createUserFolder':
			
			$userID = rand(10000,99999);
			mkdir("generated/".$userID, 0777);
			
			//echo "new user: $userID<br/>";
			
			// check for old user folders and delete them 
			$userFolders = getFiles("generated");
			//print_r($userFolders);
			//echo "<br/>";
			for($i=0;$i<count($userFolders);$i++)
			{
				$folder = $userFolders[$i];
				//echo "  folder: $folder&nbsp;($i)&nbsp;&nbsp;";
				if(is_dir($folder) && $folder != "generated/example")
				{
					$age = time()-filemtime($folder);
					//echo "  age: $age<br/>";
					$day = 60*60*24;
					if($age > $day)
						removeFiles($folder);
				}
			}
			
			
			//remove old user folders
			break;
		case 'convertFiles':
			
			$_GET['userID'];
			// get ngc files
			// loop trough files
			//   read content
			//   convert inches2mm
			//   write into file
			
			
			break;
	}
	 
	function removeFiles($folder)
	{		
		$targetFiles = getFiles($folder,array(),false);
		for($i=0;$i<count($targetFiles);$i++)
		{
			unlink($targetFiles[$i]);
		}
		rmdir($folder);
	} 
	
	function getFiles($path = ".",$allowedExts = array(),$nameOnly = false)
	{
		//print_r($allowedExts);
		//echo '<br />';
		$filter = (count($allowedExts) > 0);
		if ($handle = opendir($path)) 
		{
			$files = array();
			while (false !== ($file = readdir($handle))) 
			{
				//echo "  file: $file<br/>";
				if($file != "." && $file != "..")
				{
					if($filter)
						$ext = preg_replace('/[^\.]*\.([^\.]*)$/i','$1',$file);
					//echo "ext: $ext <br />";
					//echo "in array: ".in_array($ext,$allowedExts)."<br />";
					if(($filter && in_array($ext,$allowedExts)) || !$filter)
					{
						//echo "&nbsp;&nbsp;allowed<br/>";
						$files[] = ($nameOnly)? $file : $path.'/'.$file;
					}
				}
			}
			closedir($handle);
		}
		return $files;
	}

	/* creates a compressed zip file */
	function createZip($targetFileNames = array(),$archiveFileName,$targetFolder,$overwrite = false) 
	{
		//if the zip file already exists and overwrite is false, return false
		if(file_exists($targetFolder.$archiveFileName) && !$overwrite) 
		{ 
			return false; 
		}
		//vars
		$valid_files = array();
		//if files were passed in...
		if(is_array($targetFileNames)) 
		{
			//cycle through each file
			foreach($targetFileNames as $file) 
			{
				//make sure the file exists
				if(file_exists($targetFolder.$file)) 
				{
					//echo "  valid file: ".$file."<br />";
					$valid_files[] = $file;
				}
			}
		}
		//if we have good files...
		if(count($valid_files)) 
		{
			//create the archive
			$zip = new ZipArchive();
			//echo 'zip: '.$zip."<br/>";
			if($zip->open($targetFolder.$archiveFileName,$overwrite ? ZIPARCHIVE::OVERWRITE : ZIPARCHIVE::CREATE) !== true) 
			{
				return false;
			}
			//add the files
			foreach($valid_files as $file) 
			{
				$zip->addFile($targetFolder.$file,$file);
			}
			//debug
			//echo 'The zip archive contains ',$zip->numFiles,' files with a status of ',$zip->status;
			
			//close the zip -- done!
			$zip->close();
			
			//check to make sure the file exists
			return file_exists($targetFolder.$archiveFileName);
		}
		else
		{
			return false;
		}	
	}

?>