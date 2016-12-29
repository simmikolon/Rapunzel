//
//  LeftBranchPlatformEntity.swift
//  Rapunzel
//
//  Created by Simon Kemper on 03.03.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import GameplayKit
import SpriteKit

enum LeftBranchPlatformAnimationName: String {
    
    case Normal = "RPBranchPlatformLeftNormal"
    case JumpingOn = "RPBranchPlatformLeftJumpingOn"
    case JumpingOff = "RPBranchPlatformLeftJumpingOff"
    case BottomHit = "RPBranchPlatformLeftBottomHit"
    
    static let atlasNames = [
        
        Normal.rawValue,
        JumpingOn.rawValue,
        JumpingOff.rawValue,
        BottomHit.rawValue
    ]
}

class LeftBranchPlatformEntity: PlatformEntity, ResourceLoadableType {
    
    static var animations: [String: Animation]!
    
    init(isBreakable breakable: Bool, isBottomCollidable bottomCollidable: Bool) {
        
        guard let animations = LeftBranchPlatformEntity.animations else {
            fatalError()
        }
        
        super.init(isBreakable: breakable, isBottomCollidable: bottomCollidable, animations: animations)
        
        //let debugComponent = DebugOutputComponent(withEntity: self, andName: "BranchPlatform")
        //self.addComponent(debugComponent)
        
        animationComponent.requestedAnimation = PlatformAnimationName.Normal.rawValue
    }
    
    required init?(coder aDecoder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
}

extension LeftBranchPlatformEntity {
    
    static var resourcesNeedLoading: Bool {
        
        return animations == nil
    }
    
    static func loadResources(withCompletionHandler completionHandler: @escaping () -> ()) {
        
        SKTextureAtlas.preloadTextureAtlasesNamed(LeftBranchPlatformAnimationName.atlasNames) { error, atlases in
            
            if let error = error { fatalError("Fatal Error beim Preloading der TextureAtlases: \(error)") }
            
            animations = [:]
            /*
            var index = 0
            
            for animationName in LeftBranchPlatformAnimationName.atlasNames {
                
                animations[animationName] = AnimationComponent.animationsFromAtlas(atlases[index])
                index += 1
            }
            */
            
            animations[PlatformAnimationName.Normal.rawValue] = AnimationComponent.animationsFromAtlas(atlases[0])
            animations[PlatformAnimationName.JumpingOn.rawValue] = AnimationComponent.animationsFromAtlas(atlases[1])
            animations[PlatformAnimationName.JumpingOff.rawValue] = AnimationComponent.animationsFromAtlas(atlases[2])
            animations[PlatformAnimationName.BottomHit.rawValue] = AnimationComponent.animationsFromAtlas(atlases[3])
            
            completionHandler()
        }
    }
    
    static func purgeResources() {
        
        animations = nil
    }
}

