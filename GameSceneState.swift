//
//  GameSceneState.swift
//  Rapunzel
//
//  Created by Simon Kemper on 09.05.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import GameplayKit
import SpriteKit

class GameSceneState: GKState {

    unowned let gameScene: GameScene
    
    // MARK: Initializers
    
    required init(withGameScene gameScene: GameScene) {
        
        self.gameScene = gameScene
    }
    
    // MARK: - Lifecycle
    
    override func didEnterWithPreviousState(previousState: GKState?) {
        super.didEnterWithPreviousState(previousState)
    }
    
    // MARK: Deinitialization
    
    deinit {
        
        print("Deinitialization: \(self.dynamicType)")
    }
}
