//
//  Scene.swift
//  RapunzelSwift
//
//  Created by Simon Kemper on 13.11.15.
//  Copyright © 2015 Simon Kemper. All rights reserved.
//

import SpriteKit

class Scene: SKScene, InputManagerDelegate, InputSourceGameStateDelegate {
    
    weak var sceneManager: SceneManager!
    
    // MARK: GameInputDelegate
    
    func inputManagerDidUpdateControlInputSources(inputManager: InputManager) {
        
        // Ensure all player controlInputSources delegate game actions to `BaseScene`.
        for controlInputSource in inputManager.controlInputSources {
            controlInputSource.gameStateDelegate = self
        }
        
        #if os(iOS)
            /*
             On iOS, show or hide touch controls and focus based navigation when
             game controllers are connected or disconnected.
             */
            touchControlInputNode.hideThumbStickNodes = sceneManager.inputManager.isGameControllerConnected
            resetFocus()
        #endif
    }
    
    func inputSourceDidToggleResumeState(controlInputSource: InputSource) {
        
    }
    
    func inputSourceDidTogglePauseState(controlInputSource: InputSource) {
        
    }
}
