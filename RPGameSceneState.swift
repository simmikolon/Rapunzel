//
//  RPGameSceneState.swift
//  Rapunzel
//
//  Created by Simon Kemper on 09.05.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import GameplayKit
import SpriteKit

class RPGameSceneState: GKState {

    unowned let gameScene: RPGameScene
    
    // MARK: Initializers
    
    required init(withGameScene gameScene: RPGameScene) {
        
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
