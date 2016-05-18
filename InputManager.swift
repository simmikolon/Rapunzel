/*
    Copyright (C) 2015 Apple Inc. All Rights Reserved.
    See LICENSE.txt for this sample’s licensing information
    
    Abstract:
    An abstraction representing game input for the user currently playing the game. Manages the player's control input sources, and handles game controller connections / disconnections.
*/

import GameController

protocol InputManagerDelegate: class {
    // Called whenever a control input source is updated.
    func inputManagerDidUpdateControlInputSources(inputManager: InputManager)
}

final class InputManager {
    // MARK: Properties
    
    #if os(tvOS)
    /**
        The control input source that is native to tvOS (gameController).
        This property is optional to represent that a game controller may not be
        immediately available upon launch.
    */
    var nativeControlInputSource: InputSource?
    #else
    /// The control input source that is native to the platform (keyboard or touch).
    let nativeControlInputSource: InputSource
    #endif
    
    /// An optional secondary input source for a connected game controller.
    private(set) var secondaryControlInputSource: GameControllerInputSource?
    
    var isGameControllerConnected: Bool {
        var isGameControllerConnected = false
        dispatch_sync(controlsQueue) {
            isGameControllerConnected = (self.secondaryControlInputSource != nil) || (self.nativeControlInputSource is GameControllerInputSource)
        }
        return isGameControllerConnected
    }

    var controlInputSources: [InputSource] {
        // Return a non-optional array of `ControlInputSourceType`s.
        return [nativeControlInputSource, secondaryControlInputSource].flatMap { $0 as InputSource? }
    }

    weak var delegate: InputManagerDelegate? {
        didSet {
            // Ensure the delegate is aware of the player's current controls.
            delegate?.inputManagerDidUpdateControlInputSources(self)
        }
    }
    
    /// An internal queue to protect accessing the player's control input sources.
    private let controlsQueue = dispatch_queue_create("com.example.apple-samplecode.player.controlsqueue", DISPATCH_QUEUE_SERIAL)
    
    // MARK: Initialization

    init(nativeControlInputSource: InputSource) {
        self.nativeControlInputSource = nativeControlInputSource
        registerForGameControllerNotifications()
    }
    
    #if os(tvOS)
    init() {
        // Search for paired game controllers.
        for pairedController in GCController.controllers() {
            updateWithGameController(pairedController)
        }
        
        registerForGameControllerNotifications()
    }
    #endif

    /// Register for `GCGameController` pairing notifications.
    func registerForGameControllerNotifications() {
        NSNotificationCenter.defaultCenter().addObserver(self, selector: #selector(InputManager.handleControllerDidConnectNotification(_:)), name: GCControllerDidConnectNotification, object: nil)
        NSNotificationCenter.defaultCenter().addObserver(self, selector: #selector(InputManager.handleControllerDidDisconnectNotification(_:)), name: GCControllerDidDisconnectNotification, object: nil)
    }
    
    deinit {
        NSNotificationCenter.defaultCenter().removeObserver(self, name: GCControllerDidConnectNotification, object: nil)
        NSNotificationCenter.defaultCenter().removeObserver(self, name: GCControllerDidDisconnectNotification, object: nil)
    }
    
    func updateWithGameController(gameController: GCController) {
        dispatch_sync(controlsQueue) {
            #if os(tvOS)
            // Assign a controller to the `nativeControlInputSource` if one does not already exist.
            if self.nativeControlInputSource == nil {
                self.nativeControlInputSource = GameControllerInputSource(gameController: gameController)
                return
            }
            #endif
            
            /*
                If not already assigned, add a game controller as the player's
                secondary control input source.
            */
            if self.secondaryControlInputSource == nil {
                let gameControllerInputSource = GameControllerInputSource(gameController: gameController)
                self.secondaryControlInputSource = gameControllerInputSource
                gameController.playerIndex = .Index1
            }
        }
    }
    
    // MARK: GCGameController Notification Handling
    
    @objc func handleControllerDidConnectNotification(notification: NSNotification) {
        let connectedGameController = notification.object as! GCController
        
        updateWithGameController(connectedGameController)
        delegate?.inputManagerDidUpdateControlInputSources(self)
    }
    
    @objc func handleControllerDidDisconnectNotification(notification: NSNotification) {
        let disconnectedGameController = notification.object as! GCController
        
        // Check if the player was being controlled by the disconnected controller.
        if secondaryControlInputSource?.gameController == disconnectedGameController {
            dispatch_sync(controlsQueue) {
                self.secondaryControlInputSource = nil
            }
            
            // Check for any other connected controllers.
            if let gameController = GCController.controllers().first {
                updateWithGameController(gameController)
            }
            
            delegate?.inputManagerDidUpdateControlInputSources(self)
        }
    }
}
