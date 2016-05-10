//
//  RPGameScene.swift
//  RapunzelSwift
//
//  Created by Simon Kemper on 13.11.15.
//  Copyright © 2015 Simon Kemper. All rights reserved.
//

import SpriteKit
import GameplayKit

class RPGameScene: RPScene {
    
    // MARK: Class Methods
    
    static weak var sharedGameScene: RPGameScene!
    
    // MARK: - State Machine
    
    lazy var stateMachine: GKStateMachine = {
        
        return GKStateMachine(states: [
            
            RPGameSceneInitState(withGameScene: self),
            RPGameSceneDidMoveToViewState(withGameScene: self),
            RPGameSceneResourceLoadingState(withGameScene: self),
            RPGameSceneFinishLoadingResourcesState(withGameScene: self),
            RPGameSceneCreateLevelEntityState(withGameScene: self),
            RPGameScenePlayingState(withGameScene: self),
            RPGameScenePauseState(withGameScene: self)
            
        ])
        
    }()
    
    // MARK: - Properties
    
    let entityManagerComponent = RPEntityManagerComponent()
    let dataSource: RPLevelDataSource = RPDemoLevelDataSource()
    let contactDelegate = RPPhysicsWorldContactDelegate()
    
    private var lastUpdateTimeInterval: NSTimeInterval = 0
    private let maximumUpdateDeltaTime: NSTimeInterval = 1.0 / 60.0
    
    // MARK: - Initialisation
    
    override init(size: CGSize) {
        super.init(size: size)
        RPGameScene.sharedGameScene = self
    }
    
    required init?(coder aDecoder: NSCoder) {
        super.init(coder: aDecoder)
        RPGameScene.sharedGameScene = self
    }
    
    // MARK: View Callbacks
    
    override func didMoveToView(view: SKView) {
        stateMachine.enterState(RPGameSceneDidMoveToViewState.self)
    }
    
    // MARK: - Lifecycle
    
    override func update(currentTime: NSTimeInterval) {
        super.update(currentTime)
        guard view != nil else { return }
        stateMachine.updateWithDeltaTime(deltaTime(currentTime))
    }
    
    private func deltaTime(currentTime: NSTimeInterval) -> NSTimeInterval {
        var deltaTime = currentTime - lastUpdateTimeInterval
        deltaTime = deltaTime > maximumUpdateDeltaTime ? maximumUpdateDeltaTime : deltaTime
        lastUpdateTimeInterval = currentTime
        return deltaTime
    }
    
    // MARK: - Deinitialisation
    
    deinit {
        print("Deinit: RPGameScene")
    }
}
