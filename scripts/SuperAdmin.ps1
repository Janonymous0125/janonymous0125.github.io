# --- Script Initialization and Administrative Check ---
if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "This script needs to be run with Administrator privileges."
    Start-Process powershell.exe -Verb RunAs -ArgumentList "-File `"$PSCommandPath`""
    Exit
}

# --- Define Global Variables for Consistency ---
$SuperAdminUserName = "SuperAdmin"
$ShutdownTaskName = "Daily Shutdown at 10_30 PM"
$hostsFilePath = "$env:SystemRoot\System32\drivers\etc\hosts"
$blockedDomains = @(
    "facebook.com",
    "www.facebook.com",
    "instagram.com",
    "www.instagram.com",
    "twitter.com",
    "www.twitter.com",
    "x.com",
    "www.x.com",
    "youtube.com",
    "www.youtube.com",
    "m.youtube.com",
    "youtube-nocookie.com",
    "youtu.be",
    "tiktok.com",
    "www.tiktok.com",
    "snapchat.com",
    "www.snapchat.com",
    "linkedin.com",
    "www.linkedin.com",
    "pinterest.com",
    "www.pinterest.com",
    "reddit.com",
    "www.reddit.com",
    "tumblr.com",
    "www.tumblr.com",
    "googleusercontent.com",
    "youtube.com",
    "www.youtube.com"
)
$hostsFileHeader = "# --- Entries added by Automation Script ---"
$loopback = "127.0.0.1"

# --- Default Hosts file content ---
# This is the standard content for a default Windows hosts file.
$DefaultHostsContent = @"
# Copyright (c) 1993-2009 Microsoft Corp.
#
# This is a sample HOSTS file used by Microsoft TCP/IP for Windows.
#
# This file contains the mappings of IP addresses to host names. Each
# entry should be kept on its own line. The IP address should be placed
# in the first column followed by the corresponding host name. The
# IP address and the host name should be separated by at least one
# space.
#
# Additionally, comments (such as these) may be inserted on individual
# lines or following the machine name denoted by a '#' symbol.
#
# For example:
#
#      102.54.94.97     rhino.acme.com          # source server
#       38.25.63.10     x.acme.com              # x client host

# localhost name resolution is handled within DNS itself.
#	127.0.0.1       localhost
#	::1             localhost
"@


# --- Retry Parameters for File Operations ---
$maxRetries = 5
$retryDelaySeconds = 2

# --- Helper Function for Robust File Write ---
function Set-HostsFileContent {
    param (
        [string]$Path,
        [array]$Content
    )
    $retries = 0
    do {
        try {
            # Use ASCII for hosts file compatibility, -Force to overwrite
            $Content | Set-Content -Path $Path -Force -Encoding ASCII
            Write-Host "Successfully updated hosts file after ${retries} retries."
            return $true
        } catch [System.IO.IOException] {
            $retries++
            Write-Warning "Attempt ${retries}/${maxRetries}: Could not write to hosts file. File might be in use. Retrying in ${retryDelaySeconds} seconds..."
            Start-Sleep -Seconds $retryDelaySeconds
        } catch {
            Write-Error "An unexpected error occurred while writing to hosts file: $($_.Exception.Message)"
            return $false
        }
    } while ($retries -lt $maxRetries)
    Write-Error "Failed to update hosts file after ${maxRetries} attempts. Please check if another program (e.g., antivirus) is locking the file."
    return $false
}

# --- Helper Function for Robust File Read ---
function Get-HostsFileContent {
    param (
        [string]$Path
    )
    $retries = 0
    do {
        try {
            $content = Get-Content -Path $Path -Raw -Encoding ASCII # Read as ASCII too
            Write-Host "Successfully read hosts file after ${retries} retries."
            return $content
        } catch [System.IO.IOException] {
            $retries++
            Write-Warning "Attempt ${retries}/${maxRetries}: Could not read hosts file. File might be in use. Retrying in ${retryDelaySeconds} seconds..."
            Start-Sleep -Seconds $retryDelaySeconds
        } catch {
            Write-Error "An unexpected error occurred while reading hosts file: $($_.Exception.Message)"
            return $null
        }
    } while ($retries -lt $maxRetries)
    Write-Error "Failed to read hosts file after ${maxRetries} attempts. Please check if another program (e.g., antivirus) is locking the file."
    return $null
}

# --- Cleanup Function ---
function CleanUp-AutomationChanges {
    Write-Host "`n--- Cleanup Routine Initiated ---"
    Write-Warning "The '$SuperAdminUserName' user was found. This script will now attempt to UNDO all previous changes made by it."
    $confirmCleanup = Read-Host "Are you sure you want to proceed with the cleanup? (Y/N)"

    if ($confirmCleanup -ne "Y" -and $confirmCleanup -ne "y") {
        Write-Host "Cleanup cancelled by user. Exiting script."
        Read-Host "Press Enter to close this window..."
        Exit
    }

    # 1. Remove Scheduled Task
    Write-Host "Attempting to remove scheduled task '$ShutdownTaskName'..."
    try {
        if (Get-ScheduledTask -TaskName $ShutdownTaskName -ErrorAction SilentlyContinue) {
            Unregister-ScheduledTask -TaskName $ShutdownTaskName -Confirm:$false
            Write-Host "Scheduled task '$ShutdownTaskName' removed successfully."
        } else {
            Write-Host "Scheduled task '$ShutdownTaskName' not found. Skipping removal."
        }
    } catch {
        Write-Host "Error removing scheduled task: $($_.Exception.Message)"
    }

    # 2. Restore Hosts file to default
    Write-Host "Attempting to restore hosts file to default Windows content..."
    try {
        if (Test-Path $hostsFilePath) {
            if (Set-HostsFileContent -Path $hostsFilePath -Content $DefaultHostsContent) {
                Write-Host "Hosts file restored to default successfully."
            } else {
                Write-Error "Failed to restore hosts file to default after retries."
            }
        } else {
            Write-Host "Hosts file not found. Skipping hosts file restoration."
        }
    } catch {
        Write-Host "Error during hosts file restoration: $($_.Exception.Message)"
    }

    # 3. Prompt to reset time limits for other users
    Write-Host "`n--- Time Limit Reset ---"
    $resetUserTimeLimits = Read-Host "Do you want to reset time limits for any other user to 'all' (remove all restrictions)? (Y/N)"
    if ($resetUserTimeLimits -eq "Y" -or $resetUserTimeLimits -eq "y") {
        Write-Host "Listing local user accounts:"
        Get-LocalUser | Format-Table Name, Description -AutoSize
        $userToReset = Read-Host "Enter the username to reset time limits for (or leave blank to skip)"
        if (-not ([string]::IsNullOrWhiteSpace($userToReset))) {
            try {
                if (Get-LocalUser | Where-Object {$_.Name -eq $userToReset}) {
                    net user $userToReset /times:all
                    Write-Host "Time limits for '$userToReset' reset to 'all' successfully."
                } else {
                    Write-Warning "User '$userToReset' not found. Skipping time limit reset."
                }
            } catch {
                Write-Host "Error resetting time limits for '$userToReset': $($_.Exception.Message)"
            }
        }
    }

    # 4. Remove SuperAdmin from Administrators group
    Write-Host "Attempting to remove '$SuperAdminUserName' from Administrators group..."
    try {
        $groupCheck = net localgroup Administrators | Select-String $SuperAdminUserName
        if ($groupCheck) {
            net localgroup Administrators $SuperAdminUserName /delete
            Write-Host "User '$SuperAdminUserName' removed from Administrators group."
        } else {
            Write-Host "User '$SuperAdminUserName' not found in Administrators group. Skipping removal."
        }
    } catch {
        Write-Host "Error removing '$SuperAdminUserName' from Administrators group: $($_.Exception.Message)"
    }

    # 5. Delete SuperAdmin user
    Write-Host "Attempting to delete user '$SuperAdminUserName'..."
    try {
        $userCheck = Get-LocalUser $SuperAdminUserName -ErrorAction SilentlyContinue
        if ($userCheck) {
            net user $SuperAdminUserName /delete
            Write-Host "User '$SuperAdminUserName' deleted successfully."
        } else {
            Write-Host "User '$SuperAdminUserName' not found. Skipping deletion."
        }
    } catch {
        Write-Host "Error deleting user '$SuperAdminUserName': $($_.Exception.Message)"
    }

    Write-Host "`nCleanup routine completed. Exiting script."
    Read-Host "Press Enter to close this window..."
    Exit
}

# --- Main Script Logic (Setup Mode) ---
# Check if SuperAdmin exists
if (Get-LocalUser $SuperAdminUserName -ErrorAction SilentlyContinue) {
    CleanUp-AutomationChanges
}

# If SuperAdmin does not exist, proceed with setup
Write-Host "`n--- Setup Routine Initiated ---"

# Prompt for the SuperAdmin password
Write-Host "--- SuperAdmin Account Setup ---"
$SuperAdminPassword = Read-Host -AsSecureString "Please enter the password for the '$SuperAdminUserName' account"
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($SuperAdminPassword)
$Password = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

# 1. Create a new user 'SuperAdmin' (only if it didn't exist, as checked above)
Write-Host "Creating user '$SuperAdminUserName'..."
try {
    net user $SuperAdminUserName $Password /add
    Write-Host "User '$SuperAdminUserName' created successfully."
} catch {
    Write-Host "Error creating user '$SuperAdminUserName': $($_.Exception.Message)"
}

# 2. Add 'SuperAdmin' to the Administrators group
Write-Host "Adding '$SuperAdminUserName' to the Administrators group..."
try {
    $groupCheck = net localgroup Administrators | Select-String $SuperAdminUserName
    if (-not $groupCheck) {
        net localgroup Administrators $SuperAdminUserName /add
        Write-Host "User '$SuperAdminUserName' added to Administrators group successfully."
    } else {
        Write-Host "User '$SuperAdminUserName' is already in the Administrators group. Skipping."
    }
} catch {
    Write-Host "Error adding '$SuperAdminUserName' from Administrators group: $($_.Exception.Message)"
}

# 3. Prompt for user to set time limits
Write-Host "`n--- Setting Time Limits for a Specific User ---"
Write-Host "Listing local user accounts:"
Get-LocalUser | Format-Table Name, Description -AutoSize

$userToLimit = Read-Host "Enter the username for which you want to set time limits (leave blank to skip)"

if ([string]::IsNullOrWhiteSpace($userToLimit)) {
    Write-Warning "No username entered. Skipping time limit configuration."
} else {
    try {
        $userExists = Get-LocalUser | Where-Object {$_.Name -eq $userToLimit}
        if (-not $userExists) {
            Write-Warning "User '$userToLimit' does not exist. Please enter an existing username."
        } elseif ($userToLimit -eq $SuperAdminUserName -or $userToLimit -eq "Administrator") {
            Write-Warning "Limiting highly privileged accounts like '$userToLimit' is blocked by this script. Skipping time limit configuration."
        } else {
            $logonHours = "M-Su,09:00-22:30"
            Write-Host "`nDefault time limit is set to: $logonHours (Monday-Sunday, 9 AM to 10:30 PM)."
            $confirmTime = Read-Host "Do you want to use this default time limit? (Y/N)"

            if ($confirmTime -ne "Y" -and $confirmTime -ne "y") {
                Write-Host "Examples: "
                Write-Host "  M-F,09:00-17:00 (Mon-Fri, 9 AM to 5 PM)"
                Write-Host "  Sa,10:00-14:00;Su,12:00-16:00 (Sat 10 AM-2 PM; Sun 12 PM-4 PM)"
                Write-Host "  all (Allows login all times - removes restrictions)"
                $customLogonHours = Read-Host "Enter the custom time limit (e.g., 'M-F,09:00-17:00' or 'all')"
                if (-not ([string]::IsNullOrWhiteSpace($customLogonHours))) {
                    $logonHours = $customLogonHours
                } else {
                    Write-Warning "No custom time limit entered. Using default: $logonHours"
                }
            }

            Write-Host "Setting time limits for '$userToLimit' to: $logonHours"
            try {
                net user $userToLimit /times:$logonHours
                Write-Host "Time limits set for '$userToLimit' successfully."
            } catch {
                Write-Host "Error setting time limits for '$userToLimit': $($_.Exception.Message)"
            }
        }
    } catch {
        Write-Host "Error checking user '$userToLimit': $($_.Exception.Message)"
    }
}

# 4. Add domain names to the hosts file
Write-Host "`n--- Updating Hosts File ---"
try {
    # Read existing hosts file content using helper function
    $hostsContentRaw = Get-HostsFileContent -Path $hostsFilePath
    if (-not $hostsContentRaw) {
        Write-Error "Could not read hosts file. Skipping hosts file update."
    } else {
        $originalLines = $hostsContentRaw.Split([Environment]::NewLine)
        $newLines = @($originalLines) # Start with all original lines

        # Add the header if it's not already there
        if ($hostsContentRaw -notlike "*$hostsFileHeader*") {
            $newLines += "`n$hostsFileHeader"
            Write-Host "Added hosts file header."
        }

        foreach ($domain in $blockedDomains) {
            $entry = "$loopback`t$domain"
            if ($hostsContentRaw -notlike "*$entry*") {
                $newLines += $entry
                Write-Host "Added '$entry' to hosts file."
            } else {
                Write-Host "Entry '$entry' already exists in hosts file. Skipping."
            }
        }
        
        # Write the combined content back using helper function
        if (Set-HostsFileContent -Path $hostsFilePath -Content $newLines) {
            Write-Host "Hosts file updated successfully."
        } else {
            Write-Error "Failed to update hosts file after retries."
        }
    }
} catch {
    Write-Host "Error during hosts file update: $($_.Exception.Message)"
}

# 5. Create Scheduled Task for daily shutdown at 10:30 PM
Write-Host "`n--- Creating Scheduled Task for Daily Shutdown ---"
$shutdownTime = "22:30"

try {
    # Check if task already exists
    $existingTask = Get-ScheduledTask -TaskName $ShutdownTaskName -ErrorAction SilentlyContinue

    if ($existingTask) {
        Write-Host "Scheduled task '$ShutdownTaskName' already exists. Updating it."
        # Unregister existing task to re-create it with updated settings if needed
        Unregister-ScheduledTask -TaskName $ShutdownTaskName -Confirm:$false
    }

    # Define the action (shutdown command)
    $action = New-ScheduledTaskAction -Execute "C:\Windows\System32\shutdown.exe" -Argument "/s /f /t 0"

    # Define the trigger (daily at 10:30 PM)
    $trigger = New-ScheduledTaskTrigger -Daily -At $shutdownTime

    # Create the settings for the task
    $settings = New-ScheduledTaskSettingsSet -Compatibility Win8

    # Register the scheduled task
    Register-ScheduledTask -Action $action -Trigger $trigger -TaskName $ShutdownTaskName -Description "Forces a shutdown of the computer every day at $shutdownTime." -Settings $settings -User "System"

    Write-Host "Scheduled task '$ShutdownTaskName' created/updated successfully to shutdown daily at $shutdownTime."
} catch {
    Write-Host "Error creating/updating scheduled task: $($_.Exception.Message)"
    Write-Host "You may need to run PowerShell as Administrator to create scheduled tasks."
}

Write-Host "`nScript execution completed."
Read-Host "Press Enter to close this window..."